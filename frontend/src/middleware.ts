import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Server-side session gate (2026-08-30).
 *
 * Before this file existed, the login wall was purely client-side
 * (a useEffect redirect) — unauthenticated users always received the full
 * dashboard HTML and data fetches fired before the redirect landed.
 *
 * This middleware runs on the EDGE before any /dashboard route renders:
 *   - no `sb-access-token` cookie → redirect to /login (dashboard HTML never sent)
 *   - logged-in user hitting /login → straight to /dashboard
 *
 * Cookie PRESENCE is the gate (cheap); actual JWT verification still happens
 * server-side on every API call (authMiddleware) — this only stops the
 * unauthenticated HTML/pre-fetch churn.
 */
const ACCESS_COOKIE = 'sb-access-token';

export function middleware(req: NextRequest) {
  const hasSession = Boolean(req.cookies.get(ACCESS_COOKIE)?.value);
  const { pathname } = req.nextUrl;

  if (!hasSession && pathname.startsWith('/dashboard')) {
    const login = new URL('/login', req.url);
    return NextResponse.redirect(login);
  }

  if (hasSession && pathname === '/login') {
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/login'],
};