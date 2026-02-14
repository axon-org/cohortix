import { createClient } from '@supabase/supabase-js';

// Hardcoded for quick testing
const SUPABASE_URL = 'https://rfwscvklcokzuofyzqwx.supabase.co';
const SERVICE_ROLE_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJmd3NjdmtsY29renVvZnl6cXd4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDcyNDYyNCwiZXhwIjoyMDg2MzAwNjI0fQ.DtEf0p3b_tBCvzO5g3Al6QqCkDg-Y8K6-xRI4rcKqNM';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function inspectSchema() {
  console.log('🔍 Inspecting cohorts table data...\n');

  const { data, error } = await supabase.from('cohorts').select('*');

  if (error) {
    console.error('❌ Query failed:', error);
  } else {
    console.log(`✅ Found ${data.length} cohorts:`);
    console.log(JSON.stringify(data, null, 2));
  }
}

inspectSchema().catch(console.error);
