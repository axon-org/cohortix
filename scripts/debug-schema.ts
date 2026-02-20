#!/usr/bin/env tsx
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error(
    'Missing required env vars: NEXT_PUBLIC_SUPABASE_URL and/or SUPABASE_SERVICE_ROLE_KEY'
  );
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function debug() {
  const { data: agents } = await supabase.from('agents').select('*').limit(1);
  const { data: cohorts } = await supabase.from('cohorts').select('*').limit(1);

  console.log('Agent sample:', JSON.stringify(agents?.[0], null, 2));
  console.log('Cohort sample:', JSON.stringify(cohorts?.[0], null, 2));

  // Try a minimal insert
  const testInsert = {
    cohort_id: cohorts?.[0]?.id,
    agent_id: agents?.[0]?.id,
    engagement_score: 50,
  };

  console.log('\nTest insert:', JSON.stringify(testInsert, null, 2));

  const { data, error } = await supabase.from('cohort_members').insert(testInsert).select();

  if (error) {
    console.error('Error:', error);
  } else {
    console.log('Success:', data);
  }
}

debug();
