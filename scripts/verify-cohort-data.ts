#!/usr/bin/env tsx
/**
 * Verify Cohort Members & Activity Data
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
  auth: { autoRefreshToken: false, persistSession: false },
});

async function verifyCohortData() {
  console.log('🔍 Verifying Cohort Data for QA...\n');

  try {
    // Get all cohorts
    const { data: cohorts } = await supabase.from('cohorts').select('id, name, slug').order('name');

    if (!cohorts || cohorts.length === 0) {
      console.error('❌ No cohorts found');
      return;
    }

    console.log(`Found ${cohorts.length} cohorts\n`);
    console.log('='.repeat(70));

    for (const cohort of cohorts) {
      console.log(`\n📦 Cohort: ${cohort.name} (${cohort.slug})`);
      console.log(`   ID: ${cohort.id}\n`);

      // Get members with agent details
      const { data: members } = await supabase
        .from('cohort_members')
        .select(
          `
          engagement_score,
          joined_at,
          agent:agents (
            name,
            slug,
            role
          )
        `
        )
        .eq('cohort_id', cohort.id);

      console.log(`   👥 Members (${members?.length || 0}):`);
      if (members && members.length > 0) {
        members.forEach((m: any) => {
          console.log(`      - ${m.agent.name} (${m.agent.role})`);
          console.log(`        Engagement: ${m.engagement_score}%`);
          console.log(`        Joined: ${new Date(m.joined_at).toLocaleDateString()}`);
        });
      } else {
        console.log('      (No members)');
      }

      // Get activity logs
      const { data: activities } = await supabase
        .from('audit_logs')
        .select('action, new_values, created_at, actor_id')
        .eq('resource_type', 'cohort')
        .eq('resource_id', cohort.id)
        .order('created_at', { ascending: false });

      console.log(`\n   📝 Activity Logs (${activities?.length || 0}):`);
      if (activities && activities.length > 0) {
        // Get agent details separately
        const { data: agents } = await supabase.from('agents').select('id, name');

        const agentMap = new Map(agents?.map((a) => [a.id, a.name]));

        activities.forEach((a: any) => {
          const date = new Date(a.created_at).toLocaleDateString();
          const agentName = agentMap.get(a.actor_id) || 'Unknown';
          const contribution =
            a.new_values?.contribution || a.new_values?.cohort_name || '(no details)';
          console.log(`      - ${date}: ${agentName} ${a.action}`);
          console.log(`        ${contribution}`);
        });
      } else {
        console.log('      (No activity)');
      }

      console.log('');
    }

    console.log('='.repeat(70));
    console.log('\n✅ Data verification complete!');
    console.log('\n🎯 API Endpoints Ready:');
    console.log('   GET /api/cohorts/:id/members');
    console.log('   GET /api/cohorts/:id/activity\n');
  } catch (error) {
    console.error('❌ Verification failed:', error);
    process.exit(1);
  }
}

verifyCohortData();
