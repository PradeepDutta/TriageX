import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import { getSupabaseConfig } from './config';

const REMEMBER_MAX_AGE = 30 * 24 * 60 * 60;

export async function refreshSupabaseSession(request) {
  const config = getSupabaseConfig();
  if (!config) return NextResponse.next({ request });

  const hasAuthCookie = request.cookies
    .getAll()
    .some(({ name }) => name.startsWith('sb-') && name.includes('-auth-token'));
  if (!hasAuthCookie) return NextResponse.next({ request });

  const shouldRemember = request.cookies.has('triagex-remember');
  let response = NextResponse.next({ request });
  const secure = process.env.NODE_ENV === 'production';

  const supabase = createServerClient(config.url, config.key, {
    cookieOptions: {
      path: '/',
      sameSite: 'lax',
      secure,
      httpOnly: true,
    },
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value);
        }
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, {
            ...options,
            path: '/',
            sameSite: 'lax',
            secure,
            httpOnly: true,
            ...(shouldRemember ? { maxAge: REMEMBER_MAX_AGE } : { maxAge: undefined }),
          });
        }
        for (const [name, value] of Object.entries(headers || {})) {
          response.headers.set(name, value);
        }
      },
    },
  });

  const { error } = await supabase.auth.getClaims();
  if (error) console.error('Unable to refresh the Supabase session:', error.message);
  return response;
}
