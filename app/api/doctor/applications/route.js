import { randomUUID } from 'node:crypto';
import { validateDoctorApplicationInput, validateDoctorCredentialFile } from '@/lib/doctor-applications';
import { getAuthenticatedContext } from '@/lib/supabase/server';

const MAX_REQUEST_BYTES = 6 * 1024 * 1024;
const BUCKET = 'doctor-credentials';

async function readLimitedFormData(request) {
  const reader = request.body?.getReader();
  if (!reader) throw new Error('Request body is missing.');

  const chunks = [];
  let total = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > MAX_REQUEST_BYTES) {
      await reader.cancel();
      return null;
    }
    chunks.push(Buffer.from(value));
  }

  const response = new Response(Buffer.concat(chunks, total), {
    headers: { 'content-type': request.headers.get('content-type') || '' },
  });
  return response.formData();
}

function logDatabaseFailure(operation, error) {
  console.error(`Doctor application ${operation} failed:`, { code: error?.code || null });
}

export async function GET() {
  const context = await getAuthenticatedContext({ includeLegacyRole: false });
  if (!context.configured) return Response.json({ error: 'Authentication is not configured.' }, { status: 503 });
  if (context.error) return Response.json({ error: 'Unable to verify account access.' }, { status: 503 });
  if (!context.user) return Response.json({ error: 'Sign in is required.' }, { status: 401 });

  const { data, error } = await context.supabase
    .from('doctor_applications')
    .select('status, decision_note, submitted_at, reviewed_at')
    .eq('user_id', context.user.id)
    .maybeSingle();
  if (error) {
    logDatabaseFailure('status lookup', error);
    return Response.json({ error: 'Unable to load the doctor application status.' }, { status: 503 });
  }
  if (!data) return Response.json({ success: true, application: null });
  return Response.json({ success: true, application: data });
}

export async function POST(request) {
  const context = await getAuthenticatedContext({ includeLegacyRole: false });
  if (!context.configured) return Response.json({ error: 'Authentication is not configured.' }, { status: 503 });
  if (context.error) return Response.json({ error: 'Unable to verify account access.' }, { status: 503 });
  if (!context.user) return Response.json({ error: 'Sign in is required.' }, { status: 401 });

  const contentLength = Number(request.headers.get('content-length') || 0);
  if (contentLength > MAX_REQUEST_BYTES) {
    return Response.json({ error: 'The credential document must be no larger than 5 MB.' }, { status: 413 });
  }

  let form;
  try {
    form = await readLimitedFormData(request);
  } catch {
    return Response.json({ error: 'Submit a valid doctor application form.' }, { status: 400 });
  }
  if (!form) return Response.json({ error: 'The application upload exceeds the 5 MB document limit.' }, { status: 413 });

  const values = {
    fullName: form.get('fullName'),
    phone: form.get('phone'),
    qualification: form.get('qualification'),
    registrationNumber: form.get('registrationNumber'),
    specialization: form.get('specialization'),
    affiliation: form.get('affiliation'),
    hospitalId: form.get('hospitalId'),
    departmentId: form.get('departmentId'),
  };
  const validation = validateDoctorApplicationInput(values);
  if (!validation.valid) return Response.json({ error: validation.error }, { status: 400 });

  const file = form.get('credential');
  if (!file || typeof file.arrayBuffer !== 'function') {
    return Response.json({ error: 'Upload a supporting credential document.' }, { status: 400 });
  }
  if (file.size > 5 * 1024 * 1024) {
    return Response.json({ error: 'Credential documents must be no larger than 5 MB.' }, { status: 413 });
  }

  let bytes;
  try {
    bytes = Buffer.from(await file.arrayBuffer());
  } catch {
    return Response.json({ error: 'Unable to read the credential document.' }, { status: 400 });
  }
  const fileValidation = validateDoctorCredentialFile({
    name: file.name,
    type: file.type,
    size: file.size,
    bytes,
  });
  if (!fileValidation.valid) return Response.json({ error: fileValidation.error }, { status: 400 });

  const documentPath = `${context.user.id}/${randomUUID()}.${fileValidation.extension}`;
  const { error: uploadError } = await context.supabase.storage
    .from(BUCKET)
    .upload(documentPath, bytes, {
      contentType: fileValidation.mimeType,
      cacheControl: '60',
      upsert: false,
    });
  if (uploadError) {
    logDatabaseFailure('credential upload', uploadError);
    return Response.json({ error: 'Unable to securely upload the credential document.' }, { status: 503 });
  }

  const { data, error } = await context.supabase.rpc('submit_doctor_application', {
    application_full_name: values.fullName.trim(),
    application_phone: values.phone.trim(),
    application_qualification: values.qualification.trim(),
    application_registration_number: values.registrationNumber.trim(),
    application_specialization: values.specialization.trim(),
    application_affiliation: values.affiliation.trim(),
    application_hospital_id: values.hospitalId,
    application_department_id: values.departmentId,
    application_document_path: documentPath,
  });
  if (error) {
    const { error: cleanupError } = await context.supabase.storage.from(BUCKET).remove([documentPath]);
    if (cleanupError) logDatabaseFailure('temporary document cleanup', cleanupError);
    logDatabaseFailure('submission', error);
    const status = error.code === '23505' ? 409 : error.code === '42501' ? 403 : 400;
    return Response.json({
      error: error.code === '23505'
        ? 'An application with this account or medical registration number already exists.'
        : status === 403
          ? 'This account cannot submit a doctor application.'
          : 'Unable to submit the doctor application. Verify the details and try again.',
    }, { status });
  }

  return Response.json({ success: true, status: data?.status || 'pending' }, { status: 201 });
}
