import { NextRequest } from 'next/server';

/**
 * Clerk FAPI Proxy — API Route handler.
 * Proxies all requests from /clerkproxy/* to Clerk's Frontend API.
 */
async function handler(req: NextRequest) {
  const url = new URL(req.url);
  const clerkPath = url.pathname.replace('/clerkproxy', '') || '/';
  const targetUrl = `https://clerk.cohortix.ai${clerkPath}${url.search}`;

  const headers = new Headers(req.headers);
  headers.set(
    'Clerk-Proxy-Url',
    process.env.NEXT_PUBLIC_CLERK_PROXY_URL || `${url.origin}/__clerk`
  );
  headers.set('Clerk-Secret-Key', process.env.CLERK_SECRET_KEY || '');
  headers.set(
    'X-Forwarded-For',
    req.headers.get('x-forwarded-for') || ''
  );
  headers.set('host', 'clerk.cohortix.ai');

  try {
    const response = await fetch(targetUrl, {
      method: req.method,
      headers,
      body: req.method !== 'GET' && req.method !== 'HEAD' ? req.body : undefined,
      // @ts-ignore
      duplex: req.method !== 'GET' && req.method !== 'HEAD' ? 'half' : undefined,
    });

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Proxy error', details: String(error) }), {
      status: 502,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const PATCH = handler;
export const DELETE = handler;
export const OPTIONS = handler;

export const runtime = 'edge';
