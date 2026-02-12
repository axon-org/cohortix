import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()
    
    // Get all table names
    const { data: tables, error } = await supabase
      .rpc('pg_tables')
      .select('tablename')
      .eq('schemaname', 'public')
    
    // Try querying various tables
    const tests = await Promise.all([
      supabase.from('organizations').select('*').limit(1),
      supabase.from('agents').select('*').limit(1),
      supabase.from('projects').select('*').limit(1),
      supabase.from('tasks').select('*').limit(1),
      supabase.from('cohorts').select('*').limit(1),
    ])
    
    return NextResponse.json({
      success: true,
      results: {
        organizations: { count: tests[0].data?.length || 0, error: tests[0].error?.message },
        agents: { count: tests[1].data?.length || 0, error: tests[1].error?.message },
        projects: { count: tests[2].data?.length || 0, error: tests[2].error?.message },
        tasks: { count: tests[3].data?.length || 0, error: tests[3].error?.message },
        cohorts: { count: tests[4].data?.length || 0, error: tests[4].error?.message },
      }
    })
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error?.message || String(error)
    }, { status: 500 })
  }
}
