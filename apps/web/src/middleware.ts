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
  '/__clerk(.*)',
]);

export default clerkMiddleware(
  async (auth, request) => {
    // Skip clerk proxy requests — handled by API route
    if (request.nextUrl.pathname.startsWith('/__clerk')) {
      return NextResponse.next();
    }

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
  }
);

export const config = {
  matcher: [
    // Skip Next.js internals and all static files
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};
