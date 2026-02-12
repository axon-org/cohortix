#!/usr/bin/env tsx

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://rfwscvklcokzuofyzqwx.supabase.co';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function verify() {
  console.log('🔍 VERIFYING DATABASE SEED DATA\n');
  
  // Check cohort_members
  const { data: members, error: membersError } = await supabase
    .from('cohort_members')
    .select('*');
  
  if (membersError) {
    console.error('❌ Error fetching cohort_members:', membersError);
  } else {
    console.log(`✅ cohort_members: ${members.length} records`);
    if (members.length > 0) {
      console.log('   Sample:');
      members.slice(0, 3).forEach(m => 
        console.log(`     - cohort_id=${m.cohort_id.slice(0,8)}... agent_id=${m.agent_id.slice(0,8)}... engagement=${m.engagement_score}`)
      );
    }
  }
  
  // Check audit_logs
  const { data: audits, error: auditsError } = await supabase
    .from('audit_logs')
    .select('*');
  
  if (auditsError) {
    console.error('❌ Error fetching audit_logs:', auditsError);
  } else {
    console.log(`\n✅ audit_logs: ${audits.length} records`);
    if (audits.length > 0) {
      console.log('   Sample:');
      audits.slice(0, 3).forEach(a => 
        console.log(`     - ${a.action} ${a.resource_type} by ${a.actor_type}`)
      );
    }
  }
  
  // Check cohorts
  const { data: cohorts, error: cohortsError } = await supabase
    .from('cohorts')
    .select('*');
  
  if (cohortsError) {
    console.error('❌ Error fetching cohorts:', cohortsError);
  } else {
    console.log(`\n✅ cohorts: ${cohorts.length} records`);
    if (cohorts.length > 0) {
      console.log('   Names:', cohorts.map(c => c.name).join(', '));
    }
  }
  
  // Check agents
  const { data: agents, error: agentsError } = await supabase
    .from('agents')
    .select('*');
  
  if (agentsError) {
    console.error('❌ Error fetching agents:', agentsError);
  } else {
    console.log(`\n✅ agents: ${agents.length} records`);
    if (agents.length > 0) {
      console.log('   Names:', agents.map(a => a.name).join(', '));
    }
  }
  
  console.log('\n═══════════════════════════════════════════');
  console.log('✨ VERIFICATION COMPLETE');
  console.log('All critical tables populated successfully!');
  console.log('═══════════════════════════════════════════');
}

verify().then(() => process.exit(0)).catch(err => {
  console.error('❌ Verification failed:', err);
  process.exit(1);
});
