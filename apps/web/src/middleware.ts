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

/**
 * Proxy middleware for Clerk Frontend API.
 * Routes /__clerk/* requests through app.cohortix.ai so cookies
 * are set on the app domain, avoiding subdomain cookie issues.
 */
function proxyClerkFAPI(req: any) {
  if (req.nextUrl.pathname.startsWith('/__clerk')) {
    const proxyHeaders = new Headers(req.headers);
    proxyHeaders.set(
      'Clerk-Proxy-Url',
      process.env.NEXT_PUBLIC_CLERK_PROXY_URL || `${req.nextUrl.origin}/__clerk`
    );
    proxyHeaders.set('Clerk-Secret-Key', process.env.CLERK_SECRET_KEY || '');
    proxyHeaders.set(
      'X-Forwarded-For',
      req.ip || req.headers.get('X-Forwarded-For') || ''
    );

    const proxyUrl = new URL(req.url);
    proxyUrl.host = 'frontend-api.clerk.services';
    proxyUrl.port = '443';
    proxyUrl.protocol = 'https';
    proxyUrl.pathname = proxyUrl.pathname.replace('/__clerk', '');

    return NextResponse.rewrite(proxyUrl, {
      request: { headers: proxyHeaders },
    });
  }
  return null;
}

const clerkHandler = clerkMiddleware(
  async (auth, request) => {
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

export default function middleware(req: any) {
  // First check if it's a Clerk proxy request
  const proxyResponse = proxyClerkFAPI(req);
  if (proxyResponse) return proxyResponse;

  // Otherwise, use Clerk's auth middleware
  return clerkHandler(req, {} as any);
}

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes and Clerk proxy
    '/(api|trpc|__clerk)(.*)',
  ],
};
