import { getAuthenticatedContext } from '@/lib/supabase/server';

function isStrongPassword(password) {
  return typeof password === 'string' &&
    password.length >= 12 &&
    password.length <= 128 &&
    /[a-z]/.test(password) &&
    /[A-Z]/.test(password) &&
    /\d/.test(password);
}

export async function PATCH(request) {
  const context = await getAuthenticatedContext();
  if (!context.configured) return Response.json({ error: 'Account recovery is not configured.' }, { status: 503 });
  if (context.error) return Response.json({ error: 'Unable to verify the recovery session.' }, { status: 503 });
  if (!context.user) return Response.json({ error: 'Use the recovery link sent to your email.' }, { status: 401 });

  const { data: { claims }, error: claimsError } = await context.supabase.auth.getClaims();
  if (claimsError) return Response.json({ error: 'Unable to verify the recovery session.' }, { status: 503 });
  if (!claims?.amr?.some(({ method }) => method === 'recovery')) {
    return Response.json({ error: 'This password recovery link is invalid or has expired.' }, { status: 403 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Please submit a valid password form.' }, { status: 400 });
  }

  if (!isStrongPassword(body.newPassword)) {
    return Response.json({
      error: 'Use at least 12 characters with an uppercase letter, a lowercase letter, and a number.',
    }, { status: 400 });
  }

  const { error } = await context.supabase.auth.updateUser({ password: body.newPassword });
  if (error) {
    console.error('Supabase recovery password update failed:', error.message);
    return Response.json({ error: 'Unable to update the password right now.' }, { status: 503 });
  }

  return Response.json({ success: true, message: 'Your password has been reset. You can now sign in.' });
}
