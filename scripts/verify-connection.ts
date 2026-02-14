import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://rfwscvklcokzuofyzqwx.supabase.co';
const supabaseKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJmd3NjdmtsY29renVvZnl6cXd4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDcyNDYyNCwiZXhwIjoyMDg2MzAwNjI0fQ.DtEf0p3b_tBCvzO5g3Al6QqCkDg-Y8K6-xRI4rcKqNM';

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
