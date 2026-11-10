import { getSupabaseConfig } from '@/lib/supabase/config';
import { createSupabaseServerClient } from '@/lib/supabase/server';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request) {
  const config = getSupabaseConfig();
  if (!config) return Response.json({ error: 'Account recovery is not configured.' }, { status: 503 });

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Please enter a valid email address.' }, { status: 400 });
  }

  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  if (!EMAIL_PATTERN.test(email)) {
    return Response.json({ error: 'Please enter a valid email address.' }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${config.siteUrl}/auth/callback?next=/reset-password`,
  });
  if (error) {
    console.error('Supabase password recovery request failed:', error.message);
    return Response.json({ error: 'Unable to send a recovery email right now. Please try again later.' }, { status: 503 });
  }

  return Response.json({
    success: true,
    message: 'If an account exists for that address, a password recovery link will be sent.',
  });
}
