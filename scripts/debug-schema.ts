#!/usr/bin/env tsx
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://rfwscvklcokzuofyzqwx.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJmd3NjdmtsY29renVvZnl6cXd4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDcyNDYyNCwiZXhwIjoyMDg2MzAwNjI0fQ.DtEf0p3b_tBCvzO5g3Al6QqCkDg-Y8K6-xRI4rcKqNM';

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
  
  const { data, error } = await supabase
    .from('cohort_members')
    .insert(testInsert)
    .select();
  
  if (error) {
    console.error('Error:', error);
  } else {
    console.log('Success:', data);
  }
}

debug();
