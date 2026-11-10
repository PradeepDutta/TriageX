import { getAuthenticatedContext } from '@/lib/supabase/server';

export async function GET() {
  const context = await getAuthenticatedContext();
  if (!context.configured) return Response.json({ error: 'Account privacy controls are not configured.' }, { status: 503 });
  if (context.error) return Response.json({ error: 'Unable to verify account access.' }, { status: 503 });
  if (!context.user) return Response.json({ error: 'Sign in is required.' }, { status: 401 });

  const { data, error } = await context.supabase
    .from('privacy_requests')
    .select('id, status, created_at')
    .eq('user_id', context.user.id)
    .eq('request_type', 'account_deletion')
    .in('status', ['submitted', 'in_review'])
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) {
    console.error('Unable to load account privacy requests:', error.message);
    return Response.json({ error: 'Unable to load privacy request status.' }, { status: 503 });
  }
  return Response.json({ request: data });
}

export async function POST() {
  const context = await getAuthenticatedContext();
  if (!context.configured) return Response.json({ error: 'Account privacy controls are not configured.' }, { status: 503 });
  if (context.error) return Response.json({ error: 'Unable to verify account access.' }, { status: 503 });
  if (!context.user) return Response.json({ error: 'Sign in is required.' }, { status: 401 });

  const { data: existing, error: lookupError } = await context.supabase
    .from('privacy_requests')
    .select('id')
    .eq('user_id', context.user.id)
    .eq('request_type', 'account_deletion')
    .in('status', ['submitted', 'in_review'])
    .limit(1)
    .maybeSingle();
  if (lookupError) {
    console.error('Unable to check for an existing account deletion request:', lookupError.message);
    return Response.json({ error: 'Unable to submit a privacy request.' }, { status: 503 });
  }
  if (existing) return Response.json({ success: true, alreadySubmitted: true });

  const { error } = await context.supabase
    .from('privacy_requests')
    .insert({ user_id: context.user.id, request_type: 'account_deletion' });
  if (error) {
    console.error('Unable to submit account deletion request:', error.message);
    return Response.json({ error: 'Unable to submit a privacy request.' }, { status: 503 });
  }

  return Response.json({
    success: true,
    message: 'Your account deletion request has been submitted for administrator review.',
  }, { status: 201 });
}
