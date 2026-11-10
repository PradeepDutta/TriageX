import { cookies } from 'next/headers';
import { getSupabaseConfig } from '@/lib/supabase/config';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function POST() {
  if (!getSupabaseConfig()) {
    return Response.json({ error: 'Account access is not configured.' }, { status: 503 });
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signOut({ scope: 'global' });
  if (error) {
    console.error('Supabase global sign-out failed:', error.message);
    return Response.json({ error: 'Unable to end account sessions. Please try again.' }, { status: 503 });
  }

  (await cookies()).delete('triagex-remember');
  return Response.json({ success: true });
}
