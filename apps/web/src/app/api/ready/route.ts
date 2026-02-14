/**
 * Readiness Check Endpoint
 * Codex v1.2 §2.7.4
 *
 * Verifies service can handle requests (database connection, etc.)
 * Returns 200 OK if ready, 503 Service Unavailable if not ready.
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';

export async function GET() {
  const checks = {
    database: false,
    auth: false,
  };

  try {
    // Check database connection
    const supabase = await createClient();
    const { error: dbError } = await supabase.from('organizations').select('id').limit(1);

    checks.database = !dbError;
    checks.auth = true; // If we got here, Supabase client works

    const allHealthy = Object.values(checks).every((check) => check === true);

    if (allHealthy) {
      return NextResponse.json({
        status: 'ready',
        timestamp: new Date().toISOString(),
        checks,
      });
    } else {
      logger.warn('Service not ready', { checks });
      return NextResponse.json(
        {
          status: 'not ready',
          timestamp: new Date().toISOString(),
          checks,
        },
        { status: 503 }
      );
    }
  } catch (error) {
    logger.error('Readiness check failed', error as Error);
    return NextResponse.json(
      {
        status: 'error',
        timestamp: new Date().toISOString(),
        checks,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 503 }
    );
  }
}
