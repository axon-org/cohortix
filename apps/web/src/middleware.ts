import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

const isPublicRoute = createRouteMatcher([
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/onboarding(.*)',
  '/api/webhooks/clerk(.*)',
  '/api/ready',
  '/api/health',
]);

export default clerkMiddleware(
  async (auth, request) => {
    const url = request.nextUrl;
    const isPublic = isPublicRoute(request);

    // Debug logging (temporary - check Vercel Runtime Logs)
    const cookieNames = request.cookies.getAll().map(c => c.name);
    const { userId, sessionId } = await auth();

    console.log(JSON.stringify({
      _tag: 'AUTH_DEBUG',
      method: request.method,
      path: url.pathname,
      userId: userId || null,
      sessionId: sessionId || null,
      isPublic,
      cookies: cookieNames,
      clerkHeaders: {
        authStatus: request.headers.get('x-clerk-auth-status'),
        authReason: request.headers.get('x-clerk-auth-reason'),
      },
    }));

    // Allow bypass for testing if enabled (non-production only)
    const bypassHeader = request.headers.get('x-e2e-bypass-auth');
    const bypassSecret = process.env.E2E_BYPASS_SECRET;
    const isProduction = process.env.VERCEL_ENV === 'production';

    if (!isProduction && bypassHeader && bypassSecret && bypassHeader === bypassSecret) {
      return NextResponse.next();
    }

    if (process.env.BYPASS_AUTH === 'true') {
      return NextResponse.next();
    }

    // Only protect non-public routes
    if (!isPublic && !userId) {
      console.log(JSON.stringify({
        _tag: 'AUTH_REDIRECT',
        from: url.pathname,
        to: '/sign-in',
        reason: 'no userId for protected route',
      }));
      const signInUrl = new URL('/sign-in', request.url);
      signInUrl.searchParams.set('redirect_url', request.url);
      return NextResponse.redirect(signInUrl);
    }

    return NextResponse.next();
  }
);

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};
