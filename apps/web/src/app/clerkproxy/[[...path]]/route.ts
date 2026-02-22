import { NextRequest } from 'next/server';

/**
 * Clerk FAPI Proxy — API Route handler.
 * Proxies all requests from /clerkproxy/* to Clerk's Frontend API
 * so that cookies are set on the app's domain.
 */
async function handler(req: NextRequest) {
  const url = new URL(req.url);
  const clerkPath = url.pathname.replace('/clerkproxy', '') || '/';
  const targetUrl = `https://frontend-api.clerk.dev${clerkPath}${url.search}`;

  const proxyUrl = (process.env.NEXT_PUBLIC_CLERK_PROXY_URL || `${url.origin}/clerkproxy`).trim();
  const secretKey = (process.env.CLERK_SECRET_KEY || '').trim();

  const headers = new Headers(req.headers);
  headers.set('Clerk-Proxy-Url', proxyUrl);
  headers.set('Clerk-Secret-Key', secretKey);
  headers.set('X-Forwarded-For', req.headers.get('x-forwarded-for') || '');
  headers.delete('host');

  try {
    const response = await fetch(targetUrl, {
      method: req.method,
      headers,
      body: req.method !== 'GET' && req.method !== 'HEAD' ? req.body : undefined,
      // @ts-ignore - duplex needed for streaming request bodies in edge runtime
      duplex: req.method !== 'GET' && req.method !== 'HEAD' ? 'half' : undefined,
    });

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'Proxy error', details: String(error) }),
      { status: 502, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const PATCH = handler;
export const DELETE = handler;
export const OPTIONS = handler;

export const runtime = 'edge';
