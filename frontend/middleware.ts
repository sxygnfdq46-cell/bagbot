import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const AUTH_COOKIE = 'bagbot-auth-token';
const PUBLIC_PATHS = ['/api/health'];

const decodeClaims = (token: string | undefined | null): { role: string | null; mode: string | null } | null => {
  if (!token) return null;
  const parts = token.split('.');
  if (parts.length < 2) return null;
  try {
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
    const payload = atob(padded);
    const parsed = JSON.parse(payload) as { role?: string; mode?: string; user?: { role?: string } };
    return {
      role: parsed.user?.role || parsed.role || null,
      mode: parsed.mode || null,
    };
  } catch {
    return { role: null, mode: null };
  }
};

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow static assets and next internals
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/static') ||
    pathname === '/favicon.ico' ||
    pathname.match(/\.(?:png|jpg|jpeg|svg|ico|css|js)$/)
  ) {
    return NextResponse.next();
  }

  const token = request.cookies.get(AUTH_COOKIE)?.value;
  const isAuthenticated = Boolean(token);
  const claims = decodeClaims(token);
  const role = claims?.role;
  const mode = claims?.mode;

  // Login page should redirect authenticated users and allow anonymous access otherwise
  if (pathname === '/login') {
    if (isAuthenticated) {
      const url = request.nextUrl.clone();
      url.pathname = role === 'admin' || mode === 'admin' ? '/admin' : '/dashboard';
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  // Allow explicitly public routes
  if (PUBLIC_PATHS.includes(pathname)) {
    return NextResponse.next();
  }

  // Redirect authenticated users away from login
  if (pathname === '/login' && isAuthenticated) {
    const url = request.nextUrl.clone();
    url.pathname = role === 'admin' || mode === 'admin' ? '/admin' : '/dashboard';
    return NextResponse.redirect(url);
  }

  // Admin routes require admin role
  if (pathname.startsWith('/admin') && role !== 'admin' && mode !== 'admin') {
    return new NextResponse('Forbidden', { status: 403 });
  }

  // Protect all other routes
  if (!isAuthenticated) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|static|.*\.(?:png|jpg|jpeg|svg|ico|css|js)).*)'],
};
