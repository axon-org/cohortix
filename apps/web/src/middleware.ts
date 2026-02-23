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

    // Debug logging for auth flow (temporary)
    const cookies = request.cookies.getAll().map(c => `${c.name}=${c.value.substring(0, 20)}...`);
    const { userId, sessionId } = await auth();

    console.log(`[AUTH-DEBUG] ${request.method} ${url.pathname} | userId=${userId || 'null'} | sessionId=${sessionId || 'null'} | isPublic=${isPublic} | cookies=[${cookies.join(', ')}]`);

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

    if (!isPublic && !userId) {
      console.log(`[AUTH-DEBUG] REDIRECTING to /sign-in (no userId for protected route ${url.pathname})`);
      const signInUrl = new URL('/sign-in', request.url);
      signInUrl.searchParams.set('redirect_url', request.url);
      return NextResponse.redirect(signInUrl);
    }

    // If user is signed in and on sign-in page, redirect to dashboard
    if (isPublic && userId && url.pathname.startsWith('/sign-in')) {
      console.log(`[AUTH-DEBUG] REDIRECTING signed-in user from /sign-in to /dashboard`);
      return NextResponse.redirect(new URL('/dashboard', request.url));
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
