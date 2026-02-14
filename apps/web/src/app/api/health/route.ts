/**
 * Health Check Endpoint
 * Codex v1.2 §2.7.4
 *
 * Simple liveness check for monitoring and load balancers.
 * Returns 200 OK if service is running.
 */

import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'cohortix-api',
    version: process.env.APP_VERSION || '1.0.0',
  });
}
