import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createTriageAssessmentRow,
  getTriageAssessmentStats,
  mapTriageAssessment,
} from '../lib/triage-assessments.js';

const intakeData = {
  patientName: 'Synthetic Patient',
  age: 30,
  gender: 'Unspecified',
  symptomText: 'Mild headache',
  vitals: {},
  language: 'en',
};

test('patient assessment rows are private to the authenticated owner', () => {
  const row = createTriageAssessmentRow({
    intakeData,
    actorUserId: 'patient-user-id',
    ownerUserId: 'patient-user-id',
  });

  assert.equal(row.owner_user_id, 'patient-user-id');
  assert.equal(row.hospital_id, null);
  assert.equal(row.department_id, null);
  assert.equal(row.created_by, 'patient-user-id');
  assert.equal(row.record_data.facilityName, 'Private assessment');
  assert.equal(row.is_simulated, false);
});

test('staff assessments require an explicit hospital and department', () => {
  assert.throws(
    () => createTriageAssessmentRow({ intakeData, actorUserId: 'staff-user-id' }),
    /authorized hospital and department/
  );
});

test('staff assessment rows preserve explicit tenant scope and synthetic labeling', () => {
  const row = createTriageAssessmentRow({
    intakeData,
    actorUserId: 'staff-user-id',
    hospital: { id: 'hospital-id', name: 'Authorized Hospital' },
    departmentId: 'department-id',
    isSimulated: true,
  });

  assert.equal(row.owner_user_id, null);
  assert.equal(row.hospital_id, 'hospital-id');
  assert.equal(row.department_id, 'department-id');
  assert.equal(row.record_data.facilityName, 'Authorized Hospital');
  assert.equal(row.record_data.isSimulated, true);
});

test('mapped rows do not expose internal owner or creator identifiers', () => {
  const mapped = mapTriageAssessment({
    id: 'TRG-ABCDEF123456',
    owner_user_id: 'private-owner-id',
    created_by: 'creator-user-id',
    hospital_id: null,
    department_id: null,
    record_data: { patientName: 'Synthetic Patient' },
    triage_level: 'GREEN',
    priority_score: 20,
    status: 'PENDING_DOCTOR_APPROVAL',
    doctor_notes: '',
    reviewed_by: null,
    reviewed_at: null,
    was_overridden: false,
    is_simulated: false,
    created_at: '2026-11-10T12:00:00.000Z',
  });

  assert.equal(mapped.id, 'TRG-ABCDEF123456');
  assert.equal(mapped.patientName, 'Synthetic Patient');
  assert.equal('owner_user_id' in mapped, false);
  assert.equal('created_by' in mapped, false);
});

test('empty assignment statistics do not fabricate activity or wait times', () => {
  const stats = getTriageAssessmentStats([]);
  assert.equal(stats.totalPatients, 0);
  assert.equal(stats.avgPriority, 0);
  assert.equal(stats.avgResponseTime, '—');
  assert.equal(stats.clinicalAlignmentPct, 'N/A');
  assert.deepEqual(stats.activeFacilities, []);
});
