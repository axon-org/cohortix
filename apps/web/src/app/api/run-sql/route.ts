import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: Request) {
  try {
    const { sql } = await request.json()
    
    // Create admin client with service role key
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )
    
    // Use the pg_query RPC if available (some setups have it)
    // If not, we can't run raw SQL from client easily.
    // BUT we can use the Supabase Dashboard URL I saw in the browser tabs earlier!
    // Or I can try to use the "migrations" script if there is one.
    
    // Let's check if there is an RPC for executing SQL
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql })
    
    if (error) {
       // If RPC fails (likely does not exist), we are stuck unless we use a different method.
       return NextResponse.json({ success: false, error: error.message }, { status: 400 })
    }
    
    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
