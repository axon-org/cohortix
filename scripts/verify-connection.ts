import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function verify() {
  console.log('🔍 Verifying Supabase connection...\n');

  try {
    // Try to query a system table
    const { data, error } = await supabase.from('_realtime_schema').select('*').limit(1);

    if (error) {
      console.log('⚠️  Cannot query _realtime_schema, trying raw SQL...');

      // Try raw SQL query via RPC (if available)
      const { data: versionData, error: versionError } = await supabase.rpc('version');

      if (versionError) {
        console.log('❌ Connection failed:', versionError);
      } else {
        console.log('✅ Connected to Supabase!');
        console.log('Version:', versionData);
      }
    } else {
      console.log('✅ Connected to Supabase successfully!');
    }
  } catch (err) {
    console.error('❌ Error:', err);
  }
}

verify();
