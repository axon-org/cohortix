import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

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
 * Proxy Clerk Frontend API requests via fetch.
 * This avoids Vercel Edge Runtime TLS issues with NextResponse.rewrite.
 */
async function proxyClerkFAPI(req: NextRequest): Promise<Response | null> {
  if (!req.nextUrl.pathname.startsWith('/__clerk')) {
    return null;
  }

  const clerkPath = req.nextUrl.pathname.replace('/__clerk', '') || '/';
  const targetUrl = `https://frontend-api.clerk.dev${clerkPath}${req.nextUrl.search}`;

  const headers = new Headers(req.headers);
  headers.set('Clerk-Proxy-Url', process.env.NEXT_PUBLIC_CLERK_PROXY_URL || `${req.nextUrl.origin}/__clerk`);
  headers.set('Clerk-Secret-Key', process.env.CLERK_SECRET_KEY || '');
  headers.set('X-Forwarded-For', req.ip || req.headers.get('x-forwarded-for') || '');
  // Remove host header so it doesn't conflict with the target
  headers.delete('host');

  const response = await fetch(targetUrl, {
    method: req.method,
    headers,
    body: req.method !== 'GET' && req.method !== 'HEAD' ? req.body : undefined,
    // @ts-ignore - duplex is needed for streaming request bodies
    duplex: req.method !== 'GET' && req.method !== 'HEAD' ? 'half' : undefined,
  });

  // Forward the response with all headers (including Set-Cookie)
  const responseHeaders = new Headers(response.headers);
  
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: responseHeaders,
  });
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

export default async function middleware(req: NextRequest) {
  // First check if it's a Clerk proxy request
  const proxyResponse = await proxyClerkFAPI(req);
  if (proxyResponse) return proxyResponse;

  // Otherwise, use Clerk's auth middleware
  return clerkHandler(req, {} as any);
}

export const config = {
  matcher: [
    // Skip Next.js internals and all static files
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};
