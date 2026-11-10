import { DEFAULT_PREFERENCES, normalizePreferences, validatePreferencePatch } from '@/lib/account-preferences';
import { getAuthenticatedContext } from '@/lib/supabase/server';

function toPreferenceRow(userId, preferences) {
  return {
    user_id: userId,
    appearance: preferences.appearance,
    language: preferences.language,
    notifications: preferences.notifications,
    font_size: preferences.fontSize,
    high_contrast: preferences.highContrast,
    reduced_motion: preferences.reducedMotion,
    speech_language: preferences.speechLanguage,
    updated_at: new Date().toISOString(),
  };
}

export async function GET() {
  const context = await getAuthenticatedContext();
  if (!context.configured) return Response.json({ error: 'Account preferences are not configured.' }, { status: 503 });
  if (context.error) return Response.json({ error: 'Unable to verify account access.' }, { status: 503 });
  if (!context.user) return Response.json({ error: 'Sign in is required.' }, { status: 401 });

  const { data, error } = await context.supabase
    .from('user_preferences')
    .select('appearance, language, notifications, font_size, high_contrast, reduced_motion, speech_language')
    .eq('user_id', context.user.id)
    .maybeSingle();
  if (error) {
    console.error('Unable to load account preferences:', error.message);
    return Response.json({ error: 'Unable to load preferences.' }, { status: 503 });
  }

  const preferences = normalizePreferences(data && {
    appearance: data.appearance,
    language: data.language,
    notifications: data.notifications,
    fontSize: data.font_size,
    highContrast: data.high_contrast,
    reducedMotion: data.reduced_motion,
    speechLanguage: data.speech_language,
  });
  return Response.json({ preferences });
}

export async function PATCH(request) {
  const context = await getAuthenticatedContext();
  if (!context.configured) return Response.json({ error: 'Account preferences are not configured.' }, { status: 503 });
  if (context.error) return Response.json({ error: 'Unable to verify account access.' }, { status: 503 });
  if (!context.user) return Response.json({ error: 'Sign in is required.' }, { status: 401 });

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Please submit valid preferences.' }, { status: 400 });
  }

  const validation = validatePreferencePatch(body);
  if (!validation.valid) return Response.json({ error: validation.error }, { status: 400 });
  const patch = validation.data;
  if (Object.keys(patch).length === 0) {
    return Response.json({ error: 'Choose at least one preference to update.' }, { status: 400 });
  }

  let current = DEFAULT_PREFERENCES;
  if ('notifications' in patch) {
    const { data, error } = await context.supabase
      .from('user_preferences')
      .select('notifications')
      .eq('user_id', context.user.id)
      .maybeSingle();
    if (error) {
      console.error('Unable to load notification preferences:', error.message);
      return Response.json({ error: 'Unable to update preferences.' }, { status: 503 });
    }
    current = normalizePreferences(data);
  }

  const updated = {
    ...current,
    ...patch,
    notifications: patch.notifications
      ? { ...current.notifications, ...patch.notifications }
      : current.notifications,
  };
  const { error } = await context.supabase
    .from('user_preferences')
    .upsert(toPreferenceRow(context.user.id, updated), { onConflict: 'user_id' });
  if (error) {
    console.error('Unable to save account preferences:', error.message);
    return Response.json({ error: 'Unable to save preferences. Please try again.' }, { status: 503 });
  }

  return Response.json({ success: true, preferences: updated });
}
