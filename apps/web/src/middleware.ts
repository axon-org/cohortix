import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

// Define public routes that don't require authentication
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
    // Allow bypass for testing if enabled (non-production only)
    const bypassHeader = request.headers.get('x-e2e-bypass-auth');
    const bypassSecret = process.env.E2E_BYPASS_SECRET;
    const isProduction =
      process.env.NODE_ENV === 'production' ||
      process.env.VERCEL_ENV === 'production';

    if (
      !isProduction &&
      bypassHeader &&
      bypassSecret &&
      bypassHeader === bypassSecret
    ) {
      return NextResponse.next();
    }

    if (process.env.BYPASS_AUTH === 'true') {
      return NextResponse.next();
    }

    // Protect all routes except public ones
    if (!isPublicRoute(request)) {
      const { userId } = await auth();
      if (!userId) {
        const signInUrl = new URL('/sign-in', request.url);
        signInUrl.searchParams.set('redirect_url', request.url);
        return NextResponse.redirect(signInUrl);
      }
    }

    return NextResponse.next();
  },
  {
    authorizedParties: [
      'http://localhost:3000',
      'https://staging.cohortix.ai',
      'https://cohortix.ai',
      'https://app.cohortix.ai',
      ...(process.env.VERCEL_URL ? [`https://${process.env.VERCEL_URL}`] : []),
    ],
  }
);

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};
