import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

const isPublicRoute = createRouteMatcher([
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/onboarding(.*)',
  '/access-denied(.*)',
  '/api/webhooks/clerk(.*)',
  '/api/ready(.*)',
  '/api/health(.*)',
]);

export default clerkMiddleware(async (auth, request) => {
  const { pathname } = request.nextUrl;

  // Allow bypass for testing if enabled (non-production only)
  const bypassHeader = request.headers.get('x-e2e-bypass-auth');
  const bypassSecret = process.env.E2E_BYPASS_SECRET;
  const isProduction = process.env.VERCEL_ENV === 'production';

  if (!isProduction && bypassHeader && bypassSecret && bypassHeader === bypassSecret) {
    return NextResponse.next();
  }

  if (!isProduction && process.env.BYPASS_AUTH === 'true') {
    return NextResponse.next();
  }

  // 1. Public routes — pass through
  if (isPublicRoute(request)) {
    return NextResponse.next();
  }

  // 2. Auth check
  const { userId, orgSlug: activeOrgSlug } = await auth();
  if (!userId) {
    const signInUrl = new URL('/sign-in', request.url);
    signInUrl.searchParams.set('redirect_url', request.url);
    return NextResponse.redirect(signInUrl);
  }

  // 3. Account routes — no org needed
  if (pathname.startsWith('/account')) {
    return NextResponse.next();
  }

  // 4. API routes — session-scoped, no slug validation needed
  if (pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  // 5. Legacy /dashboard/* routes — redirect to org-scoped routes
  if (pathname.startsWith('/dashboard')) {
    if (!activeOrgSlug) {
      return NextResponse.redirect(new URL('/onboarding', request.url));
    }
    const rest = pathname.replace('/dashboard', '');
    const newPath = `/${activeOrgSlug}${rest || '/'}`;
    return NextResponse.redirect(new URL(newPath, request.url));
  }

  // 6. Root path — redirect to active org or onboarding
  if (pathname === '/') {
    if (activeOrgSlug) {
      return NextResponse.redirect(new URL(`/${activeOrgSlug}`, request.url));
    }
    return NextResponse.redirect(new URL('/onboarding', request.url));
  }

  // 7. Extract orgSlug from URL (first path segment)
  const segments = pathname.split('/').filter(Boolean);
  const urlOrgSlug = segments[0];

  // If no slug in URL, redirect to active org or onboarding
  if (!urlOrgSlug) {
    if (activeOrgSlug) {
      return NextResponse.redirect(new URL(`/${activeOrgSlug}`, request.url));
    }
    return NextResponse.redirect(new URL('/onboarding', request.url));
  }

  // 8. If URL org differs from active Clerk org, let layout handle validation
  // Middleware stays lightweight — heavy validation happens at layout level
  return NextResponse.next();
});

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};
