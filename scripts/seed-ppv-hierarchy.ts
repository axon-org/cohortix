/**
 * PPV Hierarchy Seed Script
 * 
 * Seeds distinct data for the PPV hierarchy:
 * - Missions (measurable goals in `missions` table)
 * - Operations (bounded projects in `projects` table, linked to missions)
 * - Tasks (atomic work in `tasks` table, linked to operations)
 * 
 * Run with: pnpm tsx scripts/seed-ppv-hierarchy.ts
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
)

async function main() {
  console.log('🌱 Seeding PPV Hierarchy data...\n')

  // Get first organization
  const { data: org, error: orgError } = await supabase
    .from('organizations')
    .select('id')
    .limit(1)
    .single()

  if (orgError || !org) {
    console.error('❌ Error fetching organization:', orgError)
    process.exit(1)
  }

  console.log(`📊 Organization ID: ${org.id}\n`)

  // Get first user for ownership
  const { data: membership } = await supabase
    .from('organization_memberships')
    .select('user_id')
    .eq('organization_id', org.id)
    .limit(1)
    .single()

  const userId = membership?.user_id || null

  // ============================================================================
  // 1. SEED MISSIONS (Measurable Goals)
  // ============================================================================
  console.log('📋 Creating Missions...')

  const missionsData = [
    {
      organization_id: org.id,
      title: 'Launch Cohortix MVP',
      description: 'Successfully launch Cohortix MVP with core features: Ally management, Mission/Operation/Task hierarchy, and authentication.',
      status: 'active',
      target_date: '2026-03-15',
      progress: 60,
      owner_type: 'user',
      owner_id: userId,
    },
    {
      organization_id: org.id,
      title: 'Achieve 100 Beta Users',
      description: 'Onboard 100 active beta users and gather feedback for product-market fit validation.',
      status: 'active',
      target_date: '2026-04-30',
      progress: 15,
      owner_type: 'user',
      owner_id: userId,
    },
    {
      organization_id: org.id,
      title: 'Build Agent Marketplace',
      description: 'Create a marketplace where users can discover, recruit, and configure pre-built Allies for common use cases.',
      status: 'active',
      target_date: '2026-05-31',
      progress: 0,
      owner_type: 'user',
      owner_id: userId,
    },
    {
      organization_id: org.id,
      title: 'Establish Platform Reliability',
      description: 'Achieve 99.9% uptime, sub-500ms API response times, and comprehensive monitoring.',
      status: 'active',
      target_date: '2026-03-31',
      progress: 40,
      owner_type: 'user',
      owner_id: userId,
    },
  ]

  const { data: missions, error: missionsError } = await supabase
    .from('missions')
    .insert(missionsData)
    .select()

  if (missionsError) {
    console.error('❌ Error creating missions:', missionsError)
    process.exit(1)
  }

  console.log(`✅ Created ${missions.length} missions\n`)

  // ============================================================================
  // 2. UPDATE EXISTING OPERATIONS (Link to Missions)
  // ============================================================================
  console.log('🔗 Linking existing Operations to Missions...')

  // Get existing operations (projects)
  const { data: existingOperations } = await supabase
    .from('projects')
    .select('id, name')
    .eq('organization_id', org.id)
    .limit(10)

  if (existingOperations && existingOperations.length > 0) {
    // Link operations to missions (distribute evenly)
    const updates = existingOperations.map((op, index) => {
      const missionIndex = index % missions.length
      return supabase
        .from('projects')
        .update({ mission_id: missions[missionIndex].id })
        .eq('id', op.id)
    })

    await Promise.all(updates)
    console.log(`✅ Linked ${existingOperations.length} existing operations to missions\n`)
  }

  // ============================================================================
  // 3. CREATE NEW OPERATIONS (Bounded Projects)
  // ============================================================================
  console.log('🚀 Creating new Operations...')

  const operationsData = [
    {
      organization_id: org.id,
      mission_id: missions[0].id, // Launch Cohortix MVP
      name: 'Implement PPV Data Model',
      slug: 'implement-ppv-data-model',
      description: 'Separate Missions, Operations, and Tasks into distinct tables with proper relationships.',
      status: 'active',
      start_date: '2026-02-13',
      target_date: '2026-02-15',
      owner_type: 'user',
      owner_id: userId,
      color: '#3b82f6',
      icon: 'database',
    },
    {
      organization_id: org.id,
      mission_id: missions[0].id, // Launch Cohortix MVP
      name: 'Build Authentication System',
      slug: 'build-authentication-system',
      description: 'Complete Supabase Auth integration with RLS policies and session management.',
      status: 'completed',
      start_date: '2026-02-10',
      target_date: '2026-02-12',
      owner_type: 'user',
      owner_id: userId,
      color: '#10b981',
      icon: 'lock',
    },
    {
      organization_id: org.id,
      mission_id: missions[1].id, // Achieve 100 Beta Users
      name: 'Launch Beta Program',
      slug: 'launch-beta-program',
      description: 'Create landing page, onboarding flow, and feedback collection system.',
      status: 'active',
      start_date: '2026-02-20',
      target_date: '2026-03-10',
      owner_type: 'user',
      owner_id: userId,
      color: '#f59e0b',
      icon: 'users',
    },
    {
      organization_id: org.id,
      mission_id: missions[2].id, // Build Agent Marketplace
      name: 'Design Marketplace UI',
      slug: 'design-marketplace-ui',
      description: 'Create UI mockups and components for Ally discovery and recruitment.',
      status: 'active',
      start_date: '2026-03-01',
      target_date: '2026-03-20',
      owner_type: 'user',
      owner_id: userId,
      color: '#8b5cf6',
      icon: 'shopping-cart',
    },
  ]

  const { data: operations, error: operationsError } = await supabase
    .from('projects')
    .insert(operationsData)
    .select()

  if (operationsError) {
    console.error('❌ Error creating operations:', operationsError)
    process.exit(1)
  }

  console.log(`✅ Created ${operations.length} new operations\n`)

  // ============================================================================
  // 4. CREATE TASKS (Atomic Work)
  // ============================================================================
  console.log('📝 Creating Tasks...')

  const tasksData = [
    // Tasks for "Implement PPV Data Model" operation
    {
      organization_id: org.id,
      project_id: operations[0].id,
      title: 'Create missions table migration',
      description: 'Write SQL migration to create missions table with RLS policies',
      status: 'done',
      priority: 'high',
      created_by_type: 'user',
      created_by_id: userId,
      assignee_type: 'user',
      assignee_id: userId,
      order_index: 1,
    },
    {
      organization_id: org.id,
      project_id: operations[0].id,
      title: 'Update missions API route',
      description: 'Modify missions API to query missions table instead of projects',
      status: 'done',
      priority: 'high',
      created_by_type: 'user',
      created_by_id: userId,
      assignee_type: 'user',
      assignee_id: userId,
      order_index: 2,
    },
    {
      organization_id: org.id,
      project_id: operations[0].id,
      title: 'Seed PPV hierarchy data',
      description: 'Create distinct seed data for missions, operations, and tasks',
      status: 'in_progress',
      priority: 'high',
      created_by_type: 'user',
      created_by_id: userId,
      assignee_type: 'user',
      assignee_id: userId,
      order_index: 3,
    },
    {
      organization_id: org.id,
      project_id: operations[0].id,
      title: 'Update frontend to display hierarchy',
      description: 'Ensure UI correctly displays Missions → Operations → Tasks',
      status: 'todo',
      priority: 'medium',
      created_by_type: 'user',
      created_by_id: userId,
      order_index: 4,
    },

    // Tasks for "Build Authentication System" operation
    {
      organization_id: org.id,
      project_id: operations[1].id,
      title: 'Set up Supabase Auth',
      description: 'Configure Supabase authentication providers',
      status: 'done',
      priority: 'urgent',
      created_by_type: 'user',
      created_by_id: userId,
      assignee_type: 'user',
      assignee_id: userId,
      order_index: 1,
    },
    {
      organization_id: org.id,
      project_id: operations[1].id,
      title: 'Implement RLS policies',
      description: 'Create row-level security policies for all tables',
      status: 'done',
      priority: 'urgent',
      created_by_type: 'user',
      created_by_id: userId,
      assignee_type: 'user',
      assignee_id: userId,
      order_index: 2,
    },

    // Tasks for "Launch Beta Program" operation
    {
      organization_id: org.id,
      project_id: operations[2].id,
      title: 'Create beta landing page',
      description: 'Design and build landing page with signup form',
      status: 'todo',
      priority: 'high',
      created_by_type: 'user',
      created_by_id: userId,
      order_index: 1,
    },
    {
      organization_id: org.id,
      project_id: operations[2].id,
      title: 'Set up feedback collection',
      description: 'Integrate feedback widget and analytics',
      status: 'todo',
      priority: 'medium',
      created_by_type: 'user',
      created_by_id: userId,
      order_index: 2,
    },

    // Tasks for "Design Marketplace UI" operation
    {
      organization_id: org.id,
      project_id: operations[3].id,
      title: 'Create Ally card components',
      description: 'Design reusable card components for Ally listings',
      status: 'todo',
      priority: 'medium',
      created_by_type: 'user',
      created_by_id: userId,
      order_index: 1,
    },
    {
      organization_id: org.id,
      project_id: operations[3].id,
      title: 'Build search and filter UI',
      description: 'Implement search bar and filter controls',
      status: 'todo',
      priority: 'medium',
      created_by_type: 'user',
      created_by_id: userId,
      order_index: 2,
    },
  ]

  const { data: tasks, error: tasksError } = await supabase
    .from('tasks')
    .insert(tasksData)
    .select()

  if (tasksError) {
    console.error('❌ Error creating tasks:', tasksError)
    process.exit(1)
  }

  console.log(`✅ Created ${tasks.length} tasks\n`)

  // ============================================================================
  // SUMMARY
  // ============================================================================
  console.log('✨ PPV Hierarchy Seed Complete!\n')
  console.log('Summary:')
  console.log(`  📋 Missions: ${missions.length}`)
  console.log(`  🚀 Operations: ${operations.length} new + ${existingOperations?.length || 0} linked`)
  console.log(`  📝 Tasks: ${tasks.length}`)
  console.log('\nHierarchy:')
  missions.forEach((mission: any) => {
    const missionOps = operations.filter((op: any) => op.mission_id === mission.id)
    console.log(`\n  🎯 ${mission.title} (${mission.progress}%)`)
    missionOps.forEach((op: any) => {
      const opTasks = tasks.filter((task: any) => task.project_id === op.id)
      console.log(`    ├─ ${op.name} (${opTasks.length} tasks)`)
    })
  })
}

main()
  .then(() => {
    console.log('\n✅ Done!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Error:', error)
    process.exit(1)
  })
