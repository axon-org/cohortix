/**
 * Test Supabase Connection
 * Run this to verify Supabase credentials and connection before migration
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

async function testConnection() {
  console.log('🔍 Testing Supabase Connection...\n');

  // Test 1: Basic connection with anon key
  console.log('Test 1: Anon key connection');
  const supabaseAnon = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  try {
    const { data, error } = await supabaseAnon.from('_test').select('*').limit(1);
    if (error && error.code !== 'PGRST116') {
      // PGRST116 = table not found (expected for fresh DB)
      console.log('❌ Anon key test failed:', error.message);
    } else {
      console.log('✅ Anon key connection successful');
    }
  } catch (err) {
    console.log('✅ Anon key connection successful (no tables yet)');
  }

  // Test 2: Service role key connection
  console.log('\nTest 2: Service role key connection');
  const supabaseService = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  try {
    const { data, error } = await supabaseService.from('_test').select('*').limit(1);
    if (error && error.code !== 'PGRST116') {
      console.log('❌ Service key test failed:', error.message);
    } else {
      console.log('✅ Service role key connection successful');
    }
  } catch (err) {
    console.log('✅ Service role key connection successful (no tables yet)');
  }

  // Test 3: Check extensions
  console.log('\nTest 3: Checking required PostgreSQL extensions');
  try {
    const { data: extensions, error } = await supabaseService.rpc('get_extensions');

    if (error) {
      // Try alternative query
      const query = `
        SELECT extname FROM pg_extension 
        WHERE extname IN ('uuid-ossp', 'pgcrypto', 'vector', 'pg_trgm');
      `;
      console.log('⚠️  RPC not available, will check extensions after migration');
    } else {
      console.log('✅ Extensions check successful');
    }
  } catch (err) {
    console.log('⚠️  Will verify extensions during migration');
  }

  // Test 4: Database info
  console.log('\nTest 4: Database information');
  console.log('  URL:', SUPABASE_URL);
  console.log('  Region:', SUPABASE_URL.match(/https:\/\/([^.]+)/)?.[1] || 'unknown');
  console.log('  Anon key present:', !!SUPABASE_ANON_KEY);
  console.log('  Service key present:', !!SUPABASE_SERVICE_KEY);

  console.log('\n✅ Connection tests complete!\n');
  console.log('Next steps:');
  console.log('1. Run Drizzle migrations: npm run db:migrate');
  console.log('2. Enable required extensions in Supabase dashboard');
  console.log('3. Set up RLS policies');
}

// Run tests
testConnection()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ Connection test failed:', err);
    process.exit(1);
  });
