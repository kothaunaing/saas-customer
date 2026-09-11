import { NextRequest, NextResponse } from 'next/server';

/**
 * Edge proxy for the Customer Portal (saas-customer).
 *
 * Uses `customer_access_token` — the role-scoped cookie set exclusively
 * when a CUSTOMER role logs in. This prevents a TENANT_ADMIN or PLATFORM_ADMIN
 * session from granting access to this frontend.
 *
 * Protected routes: /account, /[salon]/appointment
 * Redirect target for unauthenticated: /login?next=<path>
 * Redirect for already-authenticated on /login: /account
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Never intercept API routes or Next.js static assets
  if (pathname.startsWith('/api')) {
    return NextResponse.next();
  }

  const authenticated = Boolean(
    request.cookies.get('customer_access_token')?.value,
  );

  const protectedPage =
    pathname === '/account' ||
    /^\/[^/]+\/appointment(?:\/|$)/.test(pathname);

  if (protectedPage && !authenticated) {
    const login = new URL('/login', request.url);
    login.searchParams.set('next', pathname);
    return NextResponse.redirect(login);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.svg|favicon.ico|images/).*)'],
};
