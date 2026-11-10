import { getSafeRedirectPath, getSupabaseConfig } from '@/lib/supabase/config';
import { createSupabaseServerClient, logSupabaseAuthError } from '@/lib/supabase/server';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isStrongPassword(password) {
  return password.length >= 12 &&
    /[a-z]/.test(password) &&
    /[A-Z]/.test(password) &&
    /\d/.test(password);
}

export async function POST(request) {
  const config = getSupabaseConfig();
  if (!config) return Response.json({ error: 'Account access is not configured.' }, { status: 503 });

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Please submit a valid registration form.' }, { status: 400 });
  }

  const displayName = typeof body.displayName === 'string' ? body.displayName.trim() : '';
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  const password = typeof body.password === 'string' ? body.password : '';
  const accountIntent = body.accountType === 'doctor' ? 'doctor' : 'patient';
  if (displayName.length < 2 || displayName.length > 100 || !EMAIL_PATTERN.test(email)) {
    return Response.json({ error: 'Enter your name and a valid email address.' }, { status: 400 });
  }
  if (!isStrongPassword(password)) {
    return Response.json({
      error: 'Use at least 12 characters with an uppercase letter, a lowercase letter, and a number.',
    }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        display_name: displayName,
        ...(accountIntent === 'doctor' ? { registration_intent: 'doctor' } : {}),
      },
      emailRedirectTo: `${config.siteUrl}/auth/callback?next=${encodeURIComponent(
        getSafeRedirectPath(typeof body.redirectTo === 'string' ? body.redirectTo : '/login')
      )}`,
    },
  });

  if (error) {
    logSupabaseAuthError('patient registration', error);
    return Response.json({ error: 'Unable to create the account. Check the details or try again later.' }, { status: 400 });
  }
  if (!data.user) {
    console.error('Supabase patient registration returned no user and no error.');
    return Response.json({ error: 'Unable to verify account creation. Please try again later.' }, { status: 503 });
  }

  return Response.json({
    success: true,
    confirmationRequired: !data.session,
    message: data.session
      ? 'Your patient account is ready. You can now sign in.'
      : 'Check your email for a verification link to finish creating your patient account.',
  }, { status: 201 });
}
