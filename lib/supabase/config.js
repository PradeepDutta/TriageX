export function getSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
    || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;

  if (!url || !key || !siteUrl) return null;

  try {
    const supabaseUrl = new URL(url);
    const appUrl = new URL(siteUrl);
    if (
      !['https:', 'http:'].includes(supabaseUrl.protocol) ||
      !['https:', 'http:'].includes(appUrl.protocol) ||
      (process.env.NODE_ENV === 'production' && appUrl.protocol !== 'https:')
    ) {
      return null;
    }
  } catch {
    return null;
  }

  return { url, key, siteUrl: siteUrl.replace(/\/+$/, '') };
}

export function isSupabaseConfigured() {
  return getSupabaseConfig() !== null;
}

export function getSafeRedirectPath(path) {
  if (
    typeof path !== 'string' ||
    !path.startsWith('/') ||
    path.startsWith('//') ||
    path.includes('\\') ||
    /[\u0000-\u001f]/.test(path)
  ) {
    return '/settings';
  }
  return path;
}
