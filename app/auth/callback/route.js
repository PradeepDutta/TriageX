import { NextResponse } from 'next/server';
import { getSafeRedirectPath, getSupabaseConfig } from '@/lib/supabase/config';
import { createSupabaseServerClient, logSupabaseAuthError } from '@/lib/supabase/server';

export async function GET(request) {
  const config = getSupabaseConfig();
  if (!config) return NextResponse.redirect(new URL('/login?error=configuration', request.url));

  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const next = getSafeRedirectPath(url.searchParams.get('next'));
  if (!code) return NextResponse.redirect(new URL('/login?error=verification', config.siteUrl));

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    logSupabaseAuthError('authentication callback', error);
    return NextResponse.redirect(new URL('/login?error=verification', config.siteUrl));
  }

  return NextResponse.redirect(new URL(next, config.siteUrl));
}
