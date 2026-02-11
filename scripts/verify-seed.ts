#!/usr/bin/env tsx
/**
 * Verify Database Seed
 * Checks what data exists in the database
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://rfwscvklcokzuofyzqwx.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJmd3NjdmtsY29renVvZnl6cXd4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDcyNDYyNCwiZXhwIjoyMDg2MzAwNjI0fQ.DtEf0p3b_tBCvzO5g3Al6QqCkDg-Y8K6-xRI4rcKqNM';

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function verify() {
  console.log('🔍 Verifying database seed status...\n');

  try {
    // Check organizations
    const { data: orgs, error: orgError } = await supabase
      .from('organizations')
      .select('*');
    
    if (orgError) throw orgError;
    console.log(`✅ Organizations: ${orgs?.length || 0}`);
    orgs?.forEach((org: any) => console.log(`   - ${org.name} (${org.slug})`));
    console.log();

    // Check agents
    const { data: agents, error: agentsError } = await supabase
      .from('agents')
      .select('*');
    
    if (agentsError) throw agentsError;
    console.log(`✅ Agents (Allies): ${agents?.length || 0}`);
    agents?.forEach((agent: any) => console.log(`   - ${agent.name} (${agent.role})`));
    console.log();

    // Check clients
    const { data: clients, error: clientsError } = await supabase
      .from('clients')
      .select('*');
    
    if (clientsError) throw clientsError;
    console.log(`✅ Clients: ${clients?.length || 0}`);
    clients?.forEach((client: any) => console.log(`   - ${client.name}`));
    console.log();

    // Check projects (missions)
    const { data: projects, error: projectsError } = await supabase
      .from('projects')
      .select('*');
    
    if (projectsError) throw projectsError;
    console.log(`✅ Projects (Missions): ${projects?.length || 0}`);
    projects?.forEach((project: any) => console.log(`   - ${project.name} (${project.status})`));
    console.log();

    // Check tasks (actions)
    const { data: tasks, error: tasksError } = await supabase
      .from('tasks')
      .select('*');
    
    if (tasksError) throw tasksError;
    console.log(`✅ Tasks (Actions): ${tasks?.length || 0}`);
    console.log();

    // Check knowledge entries
    const { data: knowledge, error: knowledgeError } = await supabase
      .from('knowledge_entries')
      .select('*');
    
    if (knowledgeError) throw knowledgeError;
    console.log(`✅ Knowledge Entries: ${knowledge?.length || 0}`);
    console.log();

    // Check audit logs
    const { data: auditLogs, error: auditError } = await supabase
      .from('audit_logs')
      .select('*');
    
    if (auditError) throw auditError;
    console.log(`✅ Audit Logs: ${auditLogs?.length || 0}`);
    console.log();

    // Summary
    console.log('═══════════════════════════════════════════');
    console.log('📊 Database Status Summary:\n');
    console.log(`  Organizations: ${orgs?.length || 0}`);
    console.log(`  Agents: ${agents?.length || 0}`);
    console.log(`  Clients: ${clients?.length || 0}`);
    console.log(`  Missions: ${projects?.length || 0}`);
    console.log(`  Actions: ${tasks?.length || 0}`);
    console.log(`  Knowledge: ${knowledge?.length || 0}`);
    console.log(`  Audit Logs: ${auditLogs?.length || 0}`);
    
    const isSeeded = 
      orgs?.length > 0 && 
      agents?.length > 0 && 
      projects?.length > 0 && 
      tasks?.length > 0;

    if (isSeeded) {
      console.log('\n✨ Database is properly seeded and ready!');
    } else {
      console.log('\n⚠️  Database appears incomplete - may need seeding');
    }
    console.log('═══════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ Verification failed:', error);
    process.exit(1);
  }
}

verify();
