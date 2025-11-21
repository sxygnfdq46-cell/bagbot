import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Middleware - temporarily disabled auth to allow all routes
 */
export function middleware(request: NextRequest) {
  // Allow all requests through without authentication
  return NextResponse.next();
}

/**
 * Configure which routes this middleware should run on
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico (favicon file)
     * - public folder
     * - api routes
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\..*|api).*)',
  ],
};
