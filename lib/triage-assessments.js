import { randomUUID } from 'node:crypto';
import { processTriage } from './triage-engine.js';

const ASSESSMENT_LIMIT = 1000;

export function mapTriageAssessment(row) {
  if (!row) return null;
  return {
    ...row.record_data,
    id: row.id,
    status: row.status,
    triageLevel: row.triage_level,
    priorityScore: row.priority_score,
    doctorNotes: row.doctor_notes,
    reviewedBy: row.reviewed_by || '',
    reviewedAt: row.reviewed_at || null,
    wasOverridden: row.was_overridden,
    isSimulated: row.is_simulated,
    hospitalId: row.hospital_id,
    departmentId: row.department_id,
    createdAt: row.created_at,
  };
}

export function createTriageAssessmentRow({
  intakeData,
  actorUserId,
  ownerUserId = null,
  hospital = null,
  departmentId = null,
  isSimulated = false,
}) {
  if (!actorUserId) throw new Error('An authenticated account is required to create an assessment.');
  const isPrivateAssessment = ownerUserId === actorUserId && !hospital && !departmentId;
  if (!isPrivateAssessment && (!hospital?.id || !departmentId || ownerUserId)) {
    throw new Error('An authorized hospital and department are required for clinical queue assessments.');
  }

  const normalizedIntake = {
    ...intakeData,
    facilityName: isPrivateAssessment ? 'Private assessment' : hospital.name,
    facilityType: isPrivateAssessment ? 'Personal assessment' : 'Hospital',
  };
  const id = `TRG-${randomUUID().replaceAll('-', '').slice(0, 12).toUpperCase()}`;
  const createdAt = new Date().toISOString();
  const result = processTriage(normalizedIntake);
  const record = {
    id,
    ...normalizedIntake,
    ...result,
    status: 'PENDING_DOCTOR_APPROVAL',
    doctorNotes: '',
    reviewedBy: '',
    reviewedAt: null,
    wasOverridden: false,
    isSimulated,
    createdAt,
  };

  return {
    id,
    owner_user_id: isPrivateAssessment ? ownerUserId : null,
    hospital_id: isPrivateAssessment ? null : hospital.id,
    department_id: isPrivateAssessment ? null : departmentId,
    created_by: actorUserId,
    record_data: record,
    triage_level: result.triageLevel,
    priority_score: result.priorityScore,
    status: 'PENDING_DOCTOR_APPROVAL',
    is_simulated: isSimulated,
    doctor_notes: '',
    reviewed_by: null,
    reviewed_at: null,
    was_overridden: false,
  };
}

export async function insertTriageAssessment(supabase, assessment) {
  const { data, error } = await supabase
    .from('triage_assessments')
    .insert(assessment)
    .select('*')
    .single();

  return { data: mapTriageAssessment(data), error };
}

export async function listTriageAssessments(supabase, {
  hospitalId,
  departmentId,
  triageLevel = 'ALL',
  status = 'ALL',
  facilityType = 'ALL',
  search = '',
}) {
  let query = supabase
    .from('triage_assessments')
    .select('*')
    .eq('hospital_id', hospitalId)
    .eq('department_id', departmentId)
    .order('priority_score', { ascending: false })
    .order('created_at', { ascending: true })
    .limit(ASSESSMENT_LIMIT + 1);

  if (triageLevel !== 'ALL') query = query.eq('triage_level', triageLevel);
  if (status !== 'ALL') query = query.eq('status', status);

  const { data, error } = await query;
  if (error) return { data: null, error };
  if (data.length > ASSESSMENT_LIMIT) {
    return {
      data: null,
      tooMany: true,
      error: new Error('Queue exceeds the supported result limit. Apply filters and retry.'),
    };
  }

  const normalizedSearch = search.trim().toLowerCase();
  const records = data
    .map(mapTriageAssessment)
    .filter((record) => (
      facilityType === 'ALL' || record.facilityType === facilityType
    ))
    .filter((record) => {
      if (!normalizedSearch) return true;
      return [
        record.patientName,
        record.id,
        record.symptomText,
        record.facilityName,
      ].some((value) => String(value || '').toLowerCase().includes(normalizedSearch));
    });

  return { data: records, error: null };
}

export function getTriageAssessmentStats(records) {
  const reviewedRecords = records.filter((record) => record.status === 'DOCTOR_REVIEWED');
  const pendingRecords = records.filter((record) => record.status === 'PENDING_DOCTOR_APPROVAL');
  const overriddenCount = reviewedRecords.filter((record) => record.wasOverridden).length;
  const totalPriority = records.reduce((sum, record) => sum + record.priorityScore, 0);
  const facilityWorkload = Array.from(
    records.reduce((workload, record) => {
      const name = record.facilityName || 'Unknown facility';
      workload.set(name, (workload.get(name) || 0) + 1);
      return workload;
    }, new Map()),
    ([facilityName, patientCount]) => ({ facilityName, patientCount })
  ).sort((a, b) => b.patientCount - a.patientCount);
  const waitMinutes = pendingRecords.map((record) => Math.max(
    0,
    (Date.now() - new Date(record.createdAt).getTime()) / 60000
  ));

  return {
    totalPatients: records.length,
    redCount: records.filter((record) => record.triageLevel === 'RED').length,
    pendingRedCount: pendingRecords.filter((record) => record.triageLevel === 'RED').length,
    yellowCount: records.filter((record) => record.triageLevel === 'YELLOW').length,
    greenCount: records.filter((record) => record.triageLevel === 'GREEN').length,
    blueCount: records.filter((record) => record.triageLevel === 'BLUE').length,
    pendingCount: pendingRecords.length,
    reviewedCount: reviewedRecords.length,
    overriddenCount,
    clinicalAlignmentPct: reviewedRecords.length
      ? `${(((reviewedRecords.length - overriddenCount) / reviewedRecords.length) * 100).toFixed(1)}%`
      : 'N/A',
    avgResponseTime: waitMinutes.length
      ? `${(waitMinutes.reduce((sum, value) => sum + value, 0) / waitMinutes.length).toFixed(1)} min`
      : '—',
    avgPriority: records.length ? Math.round(totalPriority / records.length) : 0,
    activeFacilities: [...new Set(records.map((record) => record.facilityName).filter(Boolean))],
    facilityWorkload,
    timestamp: new Date().toISOString(),
  };
}
