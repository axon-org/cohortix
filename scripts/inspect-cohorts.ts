import { createClient } from '@supabase/supabase-js';

// Hardcoded for quick testing
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  throw new Error(
    'Missing required env vars: NEXT_PUBLIC_SUPABASE_URL and/or SUPABASE_SERVICE_ROLE_KEY'
  );
}

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
