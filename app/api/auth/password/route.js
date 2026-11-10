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
  if (!context.configured) return Response.json({ error: 'Account access is not configured.' }, { status: 503 });
  if (context.error) return Response.json({ error: 'Unable to verify account access.' }, { status: 503 });
  if (!context.user) return Response.json({ error: 'Sign in is required.' }, { status: 401 });

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Please submit a valid password form.' }, { status: 400 });
  }

  const currentPassword = typeof body.currentPassword === 'string' ? body.currentPassword : '';
  const newPassword = body.newPassword;
  if (!isStrongPassword(newPassword)) {
    return Response.json({
      error: 'Use at least 12 characters with an uppercase letter, a lowercase letter, and a number.',
    }, { status: 400 });
  }
  if (!context.user.email || !currentPassword) {
    return Response.json({ error: 'Enter your current password to continue.' }, { status: 400 });
  }

  const { error: verifyError } = await context.supabase.auth.signInWithPassword({
    email: context.user.email,
    password: currentPassword,
  });
  if (verifyError) return Response.json({ error: 'Current password is incorrect.' }, { status: 401 });

  const { error } = await context.supabase.auth.updateUser({ password: newPassword });
  if (error) {
    console.error('Supabase password update failed:', error.message);
    return Response.json({ error: 'Unable to update the password right now.' }, { status: 503 });
  }

  return Response.json({ success: true, message: 'Your password has been updated.' });
}
