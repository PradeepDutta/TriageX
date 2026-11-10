import { getAuthenticatedContext, requireDoctorApplicationReviewer } from '@/lib/supabase/server';

export async function GET(_request, { params }) {
  const context = await getAuthenticatedContext({ includeLegacyRole: false });
  const access = await requireDoctorApplicationReviewer(context);
  if (access.response) return access.response;

  const { userId } = await params;
  if (typeof userId !== 'string' || !/^[0-9a-f-]{36}$/i.test(userId)) {
    return Response.json({ error: 'A valid application is required.' }, { status: 400 });
  }
  const { data: application, error: applicationError } = await access.supabase
    .from('doctor_applications')
    .select('credential_document_path')
    .eq('user_id', userId)
    .maybeSingle();
  if (applicationError) {
    console.error('Unable to authorize doctor credential access:', { code: applicationError.code || null });
    return Response.json({ error: 'Unable to verify credential access.' }, { status: 503 });
  }
  if (!application?.credential_document_path) {
    return Response.json({ error: 'Credential document not found.' }, { status: 404 });
  }

  const { data, error } = await access.supabase.storage
    .from('doctor-credentials')
    .createSignedUrl(application.credential_document_path, 60);
  if (error || !data?.signedUrl) {
    console.error('Unable to create doctor credential link:', { code: error?.statusCode || null });
    return Response.json({ error: 'Unable to open the credential document.' }, { status: 503 });
  }
  return Response.json({ success: true, url: data.signedUrl });
}
