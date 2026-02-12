import { NextResponse } from 'next/server'
// import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const envVars = {
      NODE_ENV: process.env.NODE_ENV,
      BYPASS_AUTH: process.env.BYPASS_AUTH,
      NEXT_PUBLIC_SUPABASE_URL_EXISTS: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_ANON_KEY_EXISTS: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      SUPABASE_URL_VAL: process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 10) + '...',
    }
    
    return NextResponse.json({
      success: true,
      env: envVars
    })
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: 'Catch block',
      message: error?.message || String(error)
    }, { status: 500 })
  }
}
