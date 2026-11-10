import { mapDoctorApplicationForReview } from '@/lib/doctor-applications';
import { getAuthenticatedContext, requireDoctorApplicationReviewer } from '@/lib/supabase/server';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function GET() {
  const context = await getAuthenticatedContext({ includeLegacyRole: false });
  const access = await requireDoctorApplicationReviewer(context);
  if (access.response) return access.response;

  const { data, error } = await access.supabase
    .from('doctor_applications')
    .select('user_id, full_name, email, phone, qualification, registration_number, specialization, affiliation, requested_hospital_id, requested_department_id, assigned_department_id, status, decision_note, reviewer_user_id, reviewed_at, submitted_at, credential_document_path')
    .order('submitted_at', { ascending: true })
    .limit(200);
  if (error) {
    console.error('Unable to load doctor applications:', { code: error.code || null });
    return Response.json({ error: 'Unable to load doctor applications.' }, { status: 503 });
  }

  const { data: facilities, error: facilitiesError } = await access.supabase.rpc('list_active_doctor_facilities');
  if (facilitiesError) {
    console.error('Unable to map doctor application facilities:', { code: facilitiesError.code || null });
    return Response.json({ error: 'Unable to load doctor application facility details.' }, { status: 503 });
  }
  const hospitalNames = new Map((facilities || []).map((facility) => [facility.hospital_id, facility.hospital_name]));
  const departmentNames = new Map((facilities || []).map((facility) => [facility.department_id, facility.department_name]));
  const result = (data || []).map((application) => mapDoctorApplicationForReview({
    ...application,
    requested_hospital: { name: hospitalNames.get(application.requested_hospital_id) },
    requested_department: { name: departmentNames.get(application.requested_department_id) },
  }));
  return Response.json({ success: true, data: result });
}

export async function PATCH(request) {
  const context = await getAuthenticatedContext({ includeLegacyRole: false });
  const access = await requireDoctorApplicationReviewer(context);
  if (access.response) return access.response;

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Submit a valid review decision.' }, { status: 400 });
  }
  if (!body || typeof body !== 'object' || Array.isArray(body) || !UUID_PATTERN.test(body.userId || '')) {
    return Response.json({ error: 'A valid doctor application is required.' }, { status: 400 });
  }
  if (!['approve', 'reject', 'suspend'].includes(body.decision)) {
    return Response.json({ error: 'Choose approve, reject, or suspend.' }, { status: 400 });
  }
  const reason = typeof body.reason === 'string' ? body.reason.trim() : '';
  if (['reject', 'suspend'].includes(body.decision) && (reason.length < 3 || reason.length > 1000)) {
    return Response.json({ error: 'Provide a review reason between 3 and 1,000 characters.' }, { status: 400 });
  }
  if (reason.length > 1000) return Response.json({ error: 'The review note is too long.' }, { status: 400 });
  if (body.decision === 'approve' && !UUID_PATTERN.test(body.departmentId || '')) {
    return Response.json({ error: 'Choose an active department for this doctor.' }, { status: 400 });
  }

  const { data, error } = await access.supabase.rpc('review_doctor_application', {
    application_user_id: body.userId,
    decision: body.decision,
    decision_reason: reason || null,
    target_department_id: body.decision === 'approve' ? body.departmentId : null,
  });
  if (error) {
    console.error('Unable to record doctor application review:', { code: error.code || null });
    const status = error.code === '42501' ? 403 : error.code === 'P0002' ? 404 : 409;
    return Response.json({ error: status === 403
      ? 'This account is not authorized to review this application.'
      : 'Unable to apply this decision. The application may have changed; refresh and try again.' }, { status });
  }
  return Response.json({ success: true, status: data?.status });
}
