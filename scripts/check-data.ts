#!/usr/bin/env tsx
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://rfwscvklcokzuofyzqwx.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJmd3NjdmtsY29renVvZnl6cXd4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDcyNDYyNCwiZXhwIjoyMDg2MzAwNjI0fQ.DtEf0p3b_tBCvzO5g3Al6QqCkDg-Y8K6-xRI4rcKqNM';

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function checkData() {
  console.log('📊 Checking current database state...\n');
  
  // Check organizations
  const { data: orgs, error: orgError } = await supabase.from('organizations').select('*');
  console.log(`Organizations: ${orgs?.length || 0}`);
  orgs?.forEach(org => console.log(`  - ${org.name} (${org.slug})`));
  console.log();
  
  // Check agents
  const { data: agents, error: agentError } = await supabase.from('agents').select('*');
  console.log(`Agents: ${agents?.length || 0}`);
  agents?.forEach(agent => console.log(`  - ${agent.name} (${agent.role})`));
  console.log();
  
  // Check projects (missions)
  const { data: projects, error: projError } = await supabase.from('projects').select('*');
  console.log(`Missions: ${projects?.length || 0}`);
  projects?.forEach(proj => console.log(`  - ${proj.name} (${proj.status})`));
  console.log();
  
  // Check tasks (actions)
  const { data: tasks, error: taskError } = await supabase.from('tasks').select('*');
  console.log(`Actions: ${tasks?.length || 0}`);
  console.log();
  
  // Check cohorts
  const { data: cohorts, error: cohortError } = await supabase.from('cohorts').select('*');
  if (cohortError) {
    console.log(`❌ Cohorts table: ${cohortError.message}`);
  } else {
    console.log(`✅ Cohorts table exists: ${cohorts?.length || 0} records`);
  }
  
  console.log('\n✨ Database status check complete!');
}

checkData();
