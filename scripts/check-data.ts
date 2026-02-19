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

async function checkData() {
  console.log('📊 Checking current database state...\n');

  // Check organizations
  const { data: orgs, error: orgError } = await supabase.from('organizations').select('*');
  console.log(`Organizations: ${orgs?.length || 0}`);
  orgs?.forEach((org) => console.log(`  - ${org.name} (${org.slug})`));
  console.log();

  // Check agents
  const { data: agents, error: agentError } = await supabase.from('agents').select('*');
  console.log(`Agents: ${agents?.length || 0}`);
  agents?.forEach((agent) => console.log(`  - ${agent.name} (${agent.role})`));
  console.log();

  // Check projects (missions)
  const { data: projects, error: projError } = await supabase.from('projects').select('*');
  console.log(`Missions: ${projects?.length || 0}`);
  projects?.forEach((proj) => console.log(`  - ${proj.name} (${proj.status})`));
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
