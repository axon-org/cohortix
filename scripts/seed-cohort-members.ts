#!/usr/bin/env tsx
/**
 * Seed Cohort Members & Activity Logs
 * Purpose: Populate cohort_members table and audit_logs for cohort activity
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

async function seedCohortMembersAndActivity() {
  console.log('🌱 Seeding cohort members and activity logs...\n');

  try {
    // Get organization
    const { data: org } = await supabase
      .from('organizations')
      .select('id')
      .eq('slug', 'axon-hq')
      .single();

    if (!org) throw new Error('Organization not found');

    // Get all agents
    const { data: agents } = await supabase
      .from('agents')
      .select('id, slug, name, role')
      .eq('organization_id', org.id);

    if (!agents || agents.length === 0) {
      throw new Error('No agents found');
    }

    console.log(`📦 Found ${agents.length} agents\n`);

    // Get all cohorts
    const { data: cohorts } = await supabase
      .from('cohorts')
      .select('id, name, slug')
      .eq('organization_id', org.id);

    if (!cohorts || cohorts.length === 0) {
      throw new Error('No cohorts found');
    }

    console.log(`📦 Found ${cohorts.length} cohorts\n`);

    // Agent mapping
    const devi = agents.find((a) => a.slug === 'devi');
    if (!devi) throw new Error('Agent "devi" not found in seed data');
    const lubna = agents.find((a) => a.slug === 'lubna');
    if (!lubna) throw new Error('Agent "lubna" not found in seed data');
    const zara = agents.find((a) => a.slug === 'zara');
    if (!zara) throw new Error('Agent "zara" not found in seed data');
    const khalid = agents.find((a) => a.slug === 'khalid');
    if (!khalid) throw new Error('Agent "khalid" not found in seed data');

    // Cohort mapping
    const aiTeam = cohorts.find((c) => c.slug === 'ai-development-team');
    const designSquad = cohorts.find((c) => c.slug === 'product-design-squad');
    const contentTeam = cohorts.find((c) => c.slug === 'content-strategy-team');
    const devopsTeam = cohorts.find((c) => c.slug === 'devops-infrastructure');

    // ====================================================================
    // STEP 1: Populate cohort_members
    // ====================================================================
    console.log('👥 Creating cohort memberships...\n');

    const cohortMembers = [];

    // AI Development Team (3 members: Devi, Khalid, Zara)
    if (aiTeam) {
      cohortMembers.push(
        {
          cohort_id: aiTeam.id,
          agent_id: devi.id,
          engagement_score: 95,
          joined_at: new Date('2026-01-01T10:00:00Z').toISOString(),
        },
        {
          cohort_id: aiTeam.id,
          agent_id: khalid.id,
          engagement_score: 87,
          joined_at: new Date('2026-01-01T11:00:00Z').toISOString(),
        },
        {
          cohort_id: aiTeam.id,
          agent_id: zara.id,
          engagement_score: 80,
          joined_at: new Date('2026-01-02T09:00:00Z').toISOString(),
        }
      );
    }

    // Product Design Squad (2 members: Lubna, Zara)
    if (designSquad) {
      cohortMembers.push(
        {
          cohort_id: designSquad.id,
          agent_id: lubna.id,
          engagement_score: 98,
          joined_at: new Date('2026-01-15T10:00:00Z').toISOString(),
        },
        {
          cohort_id: designSquad.id,
          agent_id: zara.id,
          engagement_score: 86,
          joined_at: new Date('2026-01-15T14:00:00Z').toISOString(),
        }
      );
    }

    // Content Strategy Team (3 members: Zara, Lubna, Devi)
    if (contentTeam) {
      cohortMembers.push(
        {
          cohort_id: contentTeam.id,
          agent_id: zara.id,
          engagement_score: 93,
          joined_at: new Date('2026-02-01T10:00:00Z').toISOString(),
        },
        {
          cohort_id: contentTeam.id,
          agent_id: lubna.id,
          engagement_score: 75,
          joined_at: new Date('2026-02-01T11:00:00Z').toISOString(),
        },
        {
          cohort_id: contentTeam.id,
          agent_id: devi.id,
          engagement_score: 68,
          joined_at: new Date('2026-02-02T09:00:00Z').toISOString(),
        }
      );
    }

    // DevOps Infrastructure (2 members: Khalid, Devi) - at-risk cohort
    if (devopsTeam) {
      cohortMembers.push(
        {
          cohort_id: devopsTeam.id,
          agent_id: khalid.id,
          engagement_score: 52,
          joined_at: new Date('2026-01-10T10:00:00Z').toISOString(),
        },
        {
          cohort_id: devopsTeam.id,
          agent_id: devi.id,
          engagement_score: 38,
          joined_at: new Date('2026-01-11T09:00:00Z').toISOString(),
        }
      );
    }

    // Insert cohort members
    const { data: createdMembers, error: membersError } = await supabase
      .from('cohort_members')
      .insert(cohortMembers)
      .select();

    if (membersError) {
      // Check if it's a duplicate error (already seeded)
      if (membersError.code === '23505') {
        console.log('⚠️  Cohort members already exist, skipping...\n');
      } else {
        throw membersError;
      }
    } else {
      console.log(`✅ Created ${createdMembers?.length ?? 0} cohort memberships\n`);
    }

    // ====================================================================
    // STEP 2: Populate audit_logs for cohort activity
    // ====================================================================
    console.log('📝 Creating activity logs...\n');

    const activityLogs = [];

    // Generate activity for each cohort over the past week
    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;

    // AI Team activities (high engagement)
    if (aiTeam) {
      activityLogs.push(
        {
          organization_id: org.id,
          actor_type: 'agent',
          actor_id: devi.id,
          action: 'joined_cohort',
          resource_type: 'cohort',
          resource_id: aiTeam.id,
          new_values: { cohort_name: aiTeam.name, cohort_slug: aiTeam.slug },
          ip_address: '127.0.0.1',
          user_agent: 'Cohortix/1.0',
          created_at: new Date(now - 7 * oneDay).toISOString(),
        },
        {
          organization_id: org.id,
          actor_type: 'agent',
          actor_id: khalid.id,
          action: 'contributed',
          resource_type: 'cohort',
          resource_id: aiTeam.id,
          new_values: { contribution: 'Updated AI model architecture', cohort_slug: aiTeam.slug },
          ip_address: '127.0.0.1',
          user_agent: 'Cohortix/1.0',
          created_at: new Date(now - 5 * oneDay).toISOString(),
        },
        {
          organization_id: org.id,
          actor_type: 'agent',
          actor_id: devi.id,
          action: 'contributed',
          resource_type: 'cohort',
          resource_id: aiTeam.id,
          new_values: {
            contribution: 'Completed agent integration testing',
            cohort_slug: aiTeam.slug,
          },
          ip_address: '127.0.0.1',
          user_agent: 'Cohortix/1.0',
          created_at: new Date(now - 3 * oneDay).toISOString(),
        },
        {
          organization_id: org.id,
          actor_type: 'agent',
          actor_id: zara.id,
          action: 'contributed',
          resource_type: 'cohort',
          resource_id: aiTeam.id,
          new_values: { contribution: 'Documented AI workflows', cohort_slug: aiTeam.slug },
          ip_address: '127.0.0.1',
          user_agent: 'Cohortix/1.0',
          created_at: new Date(now - 2 * oneDay).toISOString(),
        }
      );
    }

    // Design Squad activities (very high engagement)
    if (designSquad) {
      activityLogs.push(
        {
          organization_id: org.id,
          actor_type: 'agent',
          actor_id: lubna.id,
          action: 'joined_cohort',
          resource_type: 'cohort',
          resource_id: designSquad.id,
          new_values: { cohort_name: designSquad.name, cohort_slug: designSquad.slug },
          ip_address: '127.0.0.1',
          user_agent: 'Cohortix/1.0',
          created_at: new Date(now - 6 * oneDay).toISOString(),
        },
        {
          organization_id: org.id,
          actor_type: 'agent',
          actor_id: lubna.id,
          action: 'contributed',
          resource_type: 'cohort',
          resource_id: designSquad.id,
          new_values: {
            contribution: 'Created new design system components',
            cohort_slug: designSquad.slug,
          },
          ip_address: '127.0.0.1',
          user_agent: 'Cohortix/1.0',
          created_at: new Date(now - 4 * oneDay).toISOString(),
        },
        {
          organization_id: org.id,
          actor_type: 'agent',
          actor_id: zara.id,
          action: 'contributed',
          resource_type: 'cohort',
          resource_id: designSquad.id,
          new_values: { contribution: 'Reviewed UI mockups', cohort_slug: designSquad.slug },
          ip_address: '127.0.0.1',
          user_agent: 'Cohortix/1.0',
          created_at: new Date(now - 1 * oneDay).toISOString(),
        }
      );
    }

    // Content Team activities (moderate engagement)
    if (contentTeam) {
      activityLogs.push(
        {
          organization_id: org.id,
          actor_type: 'agent',
          actor_id: zara.id,
          action: 'joined_cohort',
          resource_type: 'cohort',
          resource_id: contentTeam.id,
          new_values: { cohort_name: contentTeam.name, cohort_slug: contentTeam.slug },
          ip_address: '127.0.0.1',
          user_agent: 'Cohortix/1.0',
          created_at: new Date(now - 5 * oneDay).toISOString(),
        },
        {
          organization_id: org.id,
          actor_type: 'agent',
          actor_id: zara.id,
          action: 'contributed',
          resource_type: 'cohort',
          resource_id: contentTeam.id,
          new_values: { contribution: 'Published 3 blog posts', cohort_slug: contentTeam.slug },
          ip_address: '127.0.0.1',
          user_agent: 'Cohortix/1.0',
          created_at: new Date(now - 2 * oneDay).toISOString(),
        }
      );
    }

    // DevOps Team activities (low engagement - at-risk)
    if (devopsTeam) {
      activityLogs.push(
        {
          organization_id: org.id,
          actor_type: 'agent',
          actor_id: khalid.id,
          action: 'joined_cohort',
          resource_type: 'cohort',
          resource_id: devopsTeam.id,
          new_values: { cohort_name: devopsTeam.name, cohort_slug: devopsTeam.slug },
          ip_address: '127.0.0.1',
          user_agent: 'Cohortix/1.0',
          created_at: new Date(now - 6 * oneDay).toISOString(),
        },
        {
          organization_id: org.id,
          actor_type: 'agent',
          actor_id: khalid.id,
          action: 'contributed',
          resource_type: 'cohort',
          resource_id: devopsTeam.id,
          new_values: { contribution: 'Fixed CI pipeline issue', cohort_slug: devopsTeam.slug },
          ip_address: '127.0.0.1',
          user_agent: 'Cohortix/1.0',
          created_at: new Date(now - 4 * oneDay).toISOString(),
        }
      );
    }

    // Insert activity logs
    const { data: createdLogs, error: logsError } = await supabase
      .from('audit_logs')
      .insert(activityLogs)
      .select();

    if (logsError) {
      console.error('❌ Error creating activity logs:', logsError);
      throw logsError;
    }

    console.log(`✅ Created ${createdLogs?.length ?? 0} activity log entries\n`);

    // ====================================================================
    // STEP 3: Verify the data
    // ====================================================================
    console.log('🔍 Verifying seeded data...\n');

    for (const cohort of cohorts) {
      const { data: members } = await supabase
        .from('cohort_members')
        .select('agent_id, engagement_score')
        .eq('cohort_id', cohort.id);

      const { data: activities } = await supabase
        .from('audit_logs')
        .select('action, created_at')
        .eq('resource_type', 'cohort')
        .eq('resource_id', cohort.id);

      console.log(`📊 ${cohort.name}:`);
      console.log(`   - Members: ${members?.length || 0}`);
      console.log(`   - Activities: ${activities?.length || 0}`);
    }

    console.log('\n✨ Cohort members and activity seeding complete!\n');
    console.log('🎯 Next: QA Engineer can verify:');
    console.log('   - GET /api/cohorts/:id/members');
    console.log('   - GET /api/cohorts/:id/activity');
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

seedCohortMembersAndActivity();
