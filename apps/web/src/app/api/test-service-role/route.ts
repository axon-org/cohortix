import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  try {
    // Create admin client with service role key
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    const tests = await Promise.all([
      supabase.from('organizations').select('*'),
      supabase.from('agents').select('*'),
      supabase.from('projects').select('*'),
      supabase.from('tasks').select('*'),
      supabase.from('cohorts').select('*'),
    ]);

    return NextResponse.json({
      success: true,
      results: {
        organizations: {
          count: tests[0].data?.length || 0,
          data: tests[0].data,
          error: tests[0].error?.message,
        },
        agents: {
          count: tests[1].data?.length || 0,
          data: tests[1].data,
          error: tests[1].error?.message,
        },
        projects: {
          count: tests[2].data?.length || 0,
          data: tests[2].data,
          error: tests[2].error?.message,
        },
        tasks: {
          count: tests[3].data?.length || 0,
          data: tests[3].data,
          error: tests[3].error?.message,
        },
        cohorts: {
          count: tests[4].data?.length || 0,
          data: tests[4].data,
          error: tests[4].error?.message,
        },
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error?.message || String(error),
        stack: error?.stack,
      },
      { status: 500 }
    );
  }
}
