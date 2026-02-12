import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()
    
    // Test 1: Check connection
    const { data: orgs, error: orgError } = await supabase
      .from('organizations')
      .select('*')
      .limit(1)
    
    if (orgError) {
      return NextResponse.json({
        success: false,
        error: 'Org query failed',
        details: orgError
      }, { status: 500 })
    }
    
    // Test 2: Check cohorts
    const { data: cohorts, error: cohortError } = await supabase
      .from('cohorts')
      .select('*')
      .limit(5)
    
    if (cohortError) {
      return NextResponse.json({
        success: false,
        error: 'Cohort query failed',
        details: cohortError
      }, { status: 500 })
    }
    
    return NextResponse.json({
      success: true,
      organizations: orgs,
      cohorts: cohorts,
      env: {
        hasUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        hasKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        bypassAuth: process.env.BYPASS_AUTH
      }
    })
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: 'Catch block',
      message: error?.message || String(error),
      stack: error?.stack
    }, { status: 500 })
  }
}
