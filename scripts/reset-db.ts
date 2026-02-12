#!/usr/bin/env tsx
/**
 * Database Reset Script
 * 
 * Deletes all data from the database in the correct order (respecting foreign keys).
 * This is safer than dropping tables and preserves migrations/schema.
 * 
 * Run: pnpm db:reset
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://rfwscvklcokzuofyzqwx.supabase.co';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!serviceRoleKey) {
  throw new Error('SUPABASE_SERVICE_ROLE_KEY environment variable is not set');
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function reset() {
  console.log('🗑️  Resetting database (deleting all data)...\n');

  try {
    // Delete in reverse dependency order (children first, parents last)
    
    // 1. Audit logs (no dependencies)
    console.log('Deleting audit logs...');
    await supabase.from('audit_logs').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    console.log('✅ Audit logs deleted\n');

    // 2. Time entries (depends on tasks)
    console.log('Deleting time entries...');
    await supabase.from('time_entries').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    console.log('✅ Time entries deleted\n');

    // 3. Comments (depends on various resources)
    console.log('Deleting comments...');
    await supabase.from('comments').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    console.log('✅ Comments deleted\n');

    // 4. Tasks (depends on projects)
    console.log('Deleting tasks...');
    await supabase.from('tasks').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    console.log('✅ Tasks deleted\n');

    // 5. Milestones (depends on projects)
    console.log('Deleting milestones...');
    await supabase.from('milestones').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    console.log('✅ Milestones deleted\n');

    // 6. Projects
    console.log('Deleting projects...');
    await supabase.from('projects').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    console.log('✅ Projects deleted\n');

    // 7. Cohort members (depends on cohorts and agents)
    console.log('Deleting cohort members...');
    await supabase.from('cohort_members').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    console.log('✅ Cohort members deleted\n');

    // 8. Cohorts
    console.log('Deleting cohorts...');
    await supabase.from('cohorts').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    console.log('✅ Cohorts deleted\n');

    // 9. Knowledge entries
    console.log('Deleting knowledge entries...');
    await supabase.from('knowledge_entries').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    console.log('✅ Knowledge entries deleted\n');

    // 10. Agent assignments
    console.log('Deleting agent assignments...');
    await supabase.from('agent_assignments').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    console.log('✅ Agent assignments deleted\n');

    // 11. Agents
    console.log('Deleting agents...');
    await supabase.from('agents').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    console.log('✅ Agents deleted\n');

    // 12. Goals
    console.log('Deleting goals...');
    await supabase.from('goals').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    console.log('✅ Goals deleted\n');

    // 13. Clients
    console.log('Deleting clients...');
    await supabase.from('clients').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    console.log('✅ Clients deleted\n');

    // 14. Workspaces
    console.log('Deleting workspaces...');
    await supabase.from('workspaces').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    console.log('✅ Workspaces deleted\n');

    // 15. Organization memberships
    console.log('Deleting organization memberships...');
    await supabase.from('organization_memberships').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    console.log('✅ Organization memberships deleted\n');

    // 16. Organizations (parent of almost everything)
    console.log('Deleting organizations...');
    await supabase.from('organizations').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    console.log('✅ Organizations deleted\n');

    // Note: We don't delete users/profiles as they're managed by Supabase Auth

    console.log('═══════════════════════════════════════════');
    console.log('✨ Database reset complete!');
    console.log('All data has been deleted.');
    console.log('Schema and migrations are preserved.');
    console.log('═══════════════════════════════════════════\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Reset failed:', error);
    process.exit(1);
  }
}

reset();
