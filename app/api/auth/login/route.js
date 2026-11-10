import { cookies } from 'next/headers';
import { getSupabaseConfig } from '@/lib/supabase/config';
import { createSupabaseServerClient, logSupabaseAuthError } from '@/lib/supabase/server';
import { getPostLoginRedirect } from '@/lib/supabase/auth-redirects';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const REMEMBER_MAX_AGE = 30 * 24 * 60 * 60;

export async function POST(request) {
  const config = getSupabaseConfig();
  if (!config) return Response.json({ error: 'Account access is not configured.' }, { status: 503 });

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Please submit a valid sign-in form.' }, { status: 400 });
  }

  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  const password = typeof body.password === 'string' ? body.password : '';
  const remember = body.remember === true;
  if (!EMAIL_PATTERN.test(email) || password.length === 0 || password.length > 256) {
    return Response.json({ error: 'Enter a valid email address and password.' }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient({ remember });
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    logSupabaseAuthError('password sign-in', error);
    return Response.json({ error: 'Email or password is incorrect.' }, { status: 401 });
  }
  if (!data.user) {
    console.error('Supabase password sign-in returned no user and no error.');
    return Response.json({ error: 'Email or password is incorrect.' }, { status: 401 });
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', data.user.id)
    .maybeSingle();
  if (profileError || !profile?.role) {
    console.error('Unable to load role after account sign-in:', profileError?.message || 'Profile is missing.');
    await supabase.auth.signOut();
    return Response.json({ error: 'Unable to verify this account. Contact your administrator.' }, { status: 503 });
  }

  const cookieStore = await cookies();
  if (remember) {
    cookieStore.set('triagex-remember', '1', {
      path: '/',
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      maxAge: REMEMBER_MAX_AGE,
    });
  } else {
    cookieStore.delete('triagex-remember');
  }

  let doctorStatus = null;
  const { data: doctorApplication, error: doctorApplicationError } = await supabase
    .from('doctor_applications')
    .select('status')
    .eq('user_id', data.user.id)
    .maybeSingle();
  if (doctorApplicationError) {
    console.error('Unable to load optional doctor application status after sign-in:', {
      code: doctorApplicationError.code || null,
    });
  } else {
    doctorStatus = doctorApplication?.status || null;
  }

  return Response.json({
    success: true,
    role: profile.role,
    doctorStatus,
    redirectTo: getPostLoginRedirect(profile.role, doctorStatus, body.redirectTo),
  });
}
