#!/usr/bin/env tsx
/**
 * Verify Unified Seed Data
 * Checks that all tables were populated correctly by the unified seed script
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://rfwscvklcokzuofyzqwx.supabase.co';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function verify() {
  console.log('🔍 Verifying unified seed data...\n');

  try {
    // Check organizations
    const { data: orgs, error: orgsError } = await supabase
      .from('organizations')
      .select('*')
      .eq('slug', 'axon-hq');
    
    if (orgsError) throw orgsError;
    console.log(`✅ Organizations: ${orgs?.length || 0} (expected: 1)`);

    // Check agents
    const { data: agents, error: agentsError } = await supabase
      .from('agents')
      .select('*')
      .eq('organization_id', orgs[0]?.id);
    
    if (agentsError) throw agentsError;
    console.log(`✅ Agents: ${agents?.length || 0} (expected: 4)`);

    // Check cohorts
    const { data: cohorts, error: cohortsError } = await supabase
      .from('cohorts')
      .select('*')
      .eq('organization_id', orgs[0]?.id);
    
    if (cohortsError) throw cohortsError;
    console.log(`✅ Cohorts: ${cohorts?.length || 0} (expected: 4)`);

    // Check cohort_members (NEW!)
    const { data: members, error: membersError } = await supabase
      .from('cohort_members')
      .select('*');
    
    if (membersError) throw membersError;
    console.log(`✅ Cohort Members: ${members?.length || 0} (expected: 10)`);

    // Check projects
    const { data: projects, error: projectsError } = await supabase
      .from('projects')
      .select('*')
      .eq('organization_id', orgs[0]?.id);
    
    if (projectsError) throw projectsError;
    console.log(`✅ Projects: ${projects?.length || 0} (expected: 3)`);

    // Check tasks
    const { data: tasks, error: tasksError } = await supabase
      .from('tasks')
      .select('*')
      .eq('organization_id', orgs[0]?.id);
    
    if (tasksError) throw tasksError;
    console.log(`✅ Tasks: ${tasks?.length || 0} (expected: 5)`);

    // Check knowledge entries
    const { data: knowledge, error: knowledgeError } = await supabase
      .from('knowledge_entries')
      .select('*')
      .eq('organization_id', orgs[0]?.id);
    
    if (knowledgeError) throw knowledgeError;
    console.log(`✅ Knowledge Entries: ${knowledge?.length || 0} (expected: 3)`);

    // Check audit logs (NEW!)
    const { data: auditLogs, error: auditError } = await supabase
      .from('audit_logs')
      .select('*')
      .eq('organization_id', orgs[0]?.id);
    
    if (auditError) throw auditError;
    console.log(`✅ Audit Logs: ${auditLogs?.length || 0} (expected: 25+)`);

    // Detailed cohort member verification
    console.log('\n📊 Cohort Membership Details:');
    for (const cohort of cohorts || []) {
      const { data: cohortMembers } = await supabase
        .from('cohort_members')
        .select('*, agents(name)')
        .eq('cohort_id', cohort.id);
      
      console.log(`\n   ${cohort.name} (${cohort.status}):`);
      cohortMembers?.forEach((member: any) => {
        console.log(`     - ${member.agents?.name || 'Unknown'}: ${member.engagement_score}% engagement`);
      });
    }

    // Cohort activity verification
    console.log('\n📈 Cohort Activity Logs:');
    for (const cohort of cohorts || []) {
      const { data: activities } = await supabase
        .from('audit_logs')
        .select('*')
        .eq('resource_type', 'cohort')
        .eq('resource_id', cohort.id);
      
      console.log(`   ${cohort.name}: ${activities?.length || 0} activities`);
    }

    console.log('\n✨ Verification complete! All tables populated.\n');
    process.exit(0);

  } catch (error) {
    console.error('❌ Verification failed:', error);
    process.exit(1);
  }
}

verify();
