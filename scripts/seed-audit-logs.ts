#!/usr/bin/env tsx
/**
 * Add Audit Logs to Existing Seed Data
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error(
    'Missing required env vars: NEXT_PUBLIC_SUPABASE_URL and/or SUPABASE_SERVICE_ROLE_KEY'
  );
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function seedAuditLogs() {
  console.log('📝 Adding audit logs to existing data...\n');

  try {
    // Get existing data
    const { data: org } = await supabase
      .from('organizations')
      .select('id')
      .eq('slug', 'axon-hq')
      .single();

    const { data: agents } = await supabase
      .from('agents')
      .select('id, slug')
      .eq('organization_id', org.id);

    const { data: tasks } = await supabase
      .from('tasks')
      .select('id, title')
      .eq('organization_id', org.id)
      .limit(3);

    const { data: projects } = await supabase
      .from('projects')
      .select('id, name')
      .eq('organization_id', org.id)
      .limit(2);

    const { data: knowledge } = await supabase
      .from('knowledge_entries')
      .select('id, title')
      .eq('organization_id', org.id)
      .limit(1);

    const devi = agents.find((a: any) => a.slug === 'devi');
    const lubna = agents.find((a: any) => a.slug === 'lubna');
    const zara = agents.find((a: any) => a.slug === 'zara');
    const khalid = agents.find((a: any) => a.slug === 'khalid');

    const auditLogs = [
      {
        organization_id: org.id,
        actor_type: 'agent',
        actor_id: devi.id,
        action: 'update',
        resource_type: 'task',
        resource_id: tasks[0]?.id,
        old_values: { status: 'in_progress' },
        new_values: { status: 'done' },
        ip_address: '127.0.0.1',
        user_agent: 'Cohortix/1.0',
        created_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      },
      {
        organization_id: org.id,
        actor_type: 'agent',
        actor_id: lubna.id,
        action: 'update',
        resource_type: 'task',
        resource_id: tasks[1]?.id,
        old_values: { status: 'todo' },
        new_values: { status: 'in_progress' },
        ip_address: '127.0.0.1',
        user_agent: 'Cohortix/1.0',
        created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      },
      {
        organization_id: org.id,
        actor_type: 'agent',
        actor_id: devi.id,
        action: 'create',
        resource_type: 'project',
        resource_id: projects[0]?.id,
        new_values: { name: projects[0]?.name, status: 'active' },
        ip_address: '127.0.0.1',
        user_agent: 'Cohortix/1.0',
        created_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
      },
      {
        organization_id: org.id,
        actor_type: 'agent',
        actor_id: zara.id,
        action: 'create',
        resource_type: 'knowledge_entry',
        resource_id: knowledge[0]?.id,
        new_values: { title: knowledge[0]?.title },
        ip_address: '127.0.0.1',
        user_agent: 'Cohortix/1.0',
        created_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
      },
      {
        organization_id: org.id,
        actor_type: 'agent',
        actor_id: khalid.id,
        action: 'update',
        resource_type: 'agent',
        resource_id: khalid.id,
        old_values: { status: 'active' },
        new_values: { status: 'idle' },
        ip_address: '127.0.0.1',
        user_agent: 'Cohortix/1.0',
        created_at: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
      },
    ];

    const { data: createdLogs, error } = await supabase
      .from('audit_logs')
      .insert(auditLogs)
      .select();

    if (error) throw error;

    console.log(`✅ Created ${createdLogs.length} audit log entries`);
    console.log('✨ Database seed is now complete!\n');
  } catch (error) {
    console.error('❌ Failed to add audit logs:', error);
    process.exit(1);
  }
}

seedAuditLogs();
