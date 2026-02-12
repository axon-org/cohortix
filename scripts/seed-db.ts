#!/usr/bin/env tsx

/**
 * Unified Database Seed Script
 * 
 * Seeds the database with comprehensive test data:
 * ✅ Organizations
 * ✅ Agents (Allies)
 * ✅ Clients
 * ✅ Cohorts (Groups of agents)
 * ✅ Cohort Members (Join table - agent-to-cohort assignments)
 * ✅ Projects/Missions
 * ✅ Tasks/Actions
 * ✅ Knowledge Entries
 * ✅ Audit Logs & Activity Logs (comprehensive)
 * 
 * Run: pnpm seed (or pnpm db:seed)
 * Reset: pnpm db:reset && pnpm seed
 */

import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://rfwscvklcokzuofyzqwx.supabase.co';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!serviceRoleKey) {
  throw new Error('SUPABASE_SERVICE_ROLE_KEY environment variable is not set');
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function seed() {
  console.log('═══════════════════════════════════════════');
  console.log('🌱 UNIFIED DATABASE SEED (ALL TABLES)');
  console.log('═══════════════════════════════════════════\n');

  try {
    // =======================================================================
    // 1. CREATE DEMO ORGANIZATION
    // =======================================================================
    console.log('📦 Creating organization: Axon HQ');
    
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .insert({
        name: 'Axon HQ',
        slug: 'axon-hq',
        logo_url: 'https://api.dicebear.com/7.x/shapes/svg?seed=axon',
        plan: 'pro',
        settings: {
          timezone: 'America/New_York',
          defaultLanguage: 'en',
          features: {
            aiAgents: true,
            knowledgeBase: true,
            analytics: true,
          },
        },
      })
      .select()
      .single();

    if (orgError) throw new Error(`Failed to create organization: ${orgError.message}`);
    console.log(`✅ Created organization: ${org.name} (${org.id})\n`);

    // =======================================================================
    // 2. CREATE SAMPLE AI ALLIES (AGENTS)
    // =======================================================================
    console.log('🤖 Creating AI allies...');
    
    const allies = [
      {
        organization_id: org.id,
        external_id: 'clawdbot-devi',
        name: 'Devi',
        slug: 'devi',
        role: 'AI Developer Specialist',
        description: 'Expert in LLM integration, RAG systems, and autonomous agent development. Specializes in Python, TypeScript, and AI frameworks.',
        avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=devi',
        status: 'active',
        capabilities: ['coding', 'architecture', 'ai-integration', 'testing'],
        runtime_type: 'clawdbot',
        runtime_config: {
          modelPreference: 'claude-3-5-sonnet',
          autonomyLevel: 'high',
        },
      },
      {
        organization_id: org.id,
        external_id: 'clawdbot-lubna',
        name: 'Lubna',
        slug: 'lubna',
        role: 'UI/UX Designer',
        description: 'Crafts beautiful, intuitive interfaces with deep expertise in design systems, accessibility, and user research.',
        avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=lubna',
        status: 'active',
        capabilities: ['design', 'prototyping', 'user-research', 'figma'],
        runtime_type: 'clawdbot',
        runtime_config: {
          modelPreference: 'claude-3-5-sonnet',
          autonomyLevel: 'high',
        },
      },
      {
        organization_id: org.id,
        external_id: 'clawdbot-zara',
        name: 'Zara',
        slug: 'zara',
        role: 'Content Strategist',
        description: 'Creates compelling narratives and strategic content. Expert in technical writing, SEO, and content operations.',
        avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=zara',
        status: 'active',
        capabilities: ['writing', 'content-strategy', 'seo', 'documentation'],
        runtime_type: 'clawdbot',
        runtime_config: {
          modelPreference: 'claude-3-5-sonnet',
          autonomyLevel: 'high',
        },
      },
      {
        organization_id: org.id,
        external_id: 'clawdbot-khalid',
        name: 'Khalid',
        slug: 'khalid',
        role: 'DevOps Engineer',
        description: 'Builds reliable infrastructure with expertise in cloud platforms, CI/CD, and monitoring systems.',
        avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=khalid',
        status: 'idle',
        capabilities: ['devops', 'cloud-infrastructure', 'ci-cd', 'monitoring'],
        runtime_type: 'clawdbot',
        runtime_config: {
          modelPreference: 'claude-3-5-sonnet',
          autonomyLevel: 'high',
        },
      },
    ];

    const { data: createdAllies, error: alliesError } = await supabase
      .from('agents')
      .insert(allies)
      .select();

    if (alliesError) throw new Error(`Failed to create agents: ${alliesError.message}`);
    console.log(`✅ Created ${createdAllies.length} allies:\n`);
    createdAllies.forEach((ally: any) => console.log(`   - ${ally.name} (${ally.role})`));
    console.log();

    // Agent quick reference
    const devi = createdAllies.find((a: any) => a.slug === 'devi')!;
    const lubna = createdAllies.find((a: any) => a.slug === 'lubna')!;
    const zara = createdAllies.find((a: any) => a.slug === 'zara')!;
    const khalid = createdAllies.find((a: any) => a.slug === 'khalid')!;

    // =======================================================================
    // 3. CREATE SAMPLE CLIENT
    // =======================================================================
    console.log('🏢 Creating sample client...');
    
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .insert({
        organization_id: org.id,
        name: 'TechCorp Inc.',
        slug: 'techcorp',
        description: 'Leading enterprise software company',
        industry: 'technology',
        contact_name: 'Sarah Johnson',
        contact_email: 'sarah@techcorp.com',
        metadata: {
          employees: '500-1000',
          revenue: '$50M-$100M',
          region: 'North America',
        },
      })
      .select()
      .single();

    if (clientError) throw new Error(`Failed to create client: ${clientError.message}`);
    console.log(`✅ Created client: ${client.name}\n`);

    // =======================================================================
    // 4. CREATE SAMPLE COHORTS (AGENT GROUPS)
    // =======================================================================
    console.log('👥 Creating sample cohorts...');

    const cohortData = [
      {
        organization_id: org.id,
        name: 'AI Development Team',
        slug: 'ai-development-team',
        description: 'Core team building autonomous AI systems and agent infrastructure',
        status: 'active',
        start_date: '2026-01-01',
        end_date: '2026-06-30',
        created_by: org.id, // Placeholder
        settings: {},
      },
      {
        organization_id: org.id,
        name: 'Product Design Squad',
        slug: 'product-design-squad',
        description: 'Design excellence team focused on user experience and visual design',
        status: 'active',
        start_date: '2026-01-15',
        created_by: org.id,
        settings: {},
      },
      {
        organization_id: org.id,
        name: 'Content Strategy Team',
        slug: 'content-strategy-team',
        description: 'Content creation and strategic messaging',
        status: 'active',
        start_date: '2026-02-01',
        created_by: org.id,
        settings: {},
      },
      {
        organization_id: org.id,
        name: 'DevOps Infrastructure',
        slug: 'devops-infrastructure',
        description: 'Platform reliability and deployment automation',
        status: 'at-risk', // Low engagement cohort
        start_date: '2026-01-10',
        created_by: org.id,
        settings: {},
      },
    ];

    const { data: createdCohorts, error: cohortsError } = await supabase
      .from('cohorts')
      .insert(cohortData)
      .select();

    if (cohortsError) throw new Error(`Failed to create cohorts: ${cohortsError.message}`);
    console.log(`✅ Created ${createdCohorts.length} cohorts:\n`);
    createdCohorts.forEach((cohort: any) => 
      console.log(`   - ${cohort.name} (${cohort.status})`)
    );
    console.log();

    // Cohort quick reference
    const aiTeam = createdCohorts.find((c: any) => c.slug === 'ai-development-team')!;
    const designSquad = createdCohorts.find((c: any) => c.slug === 'product-design-squad')!;
    const contentTeam = createdCohorts.find((c: any) => c.slug === 'content-strategy-team')!;
    const devopsTeam = createdCohorts.find((c: any) => c.slug === 'devops-infrastructure')!;

    // =======================================================================
    // 5. CREATE COHORT MEMBERS (AGENT-TO-COHORT ASSIGNMENTS)
    // =======================================================================
    console.log('🔗 Creating cohort memberships...');

    const membershipData = [
      // AI Development Team (3 members: Devi, Khalid, Zara)
      {
        cohort_id: aiTeam.id,
        agent_id: devi.id,
        engagement_score: 95.00,
        joined_at: new Date('2026-01-01T10:00:00Z').toISOString(),
      },
      {
        cohort_id: aiTeam.id,
        agent_id: khalid.id,
        engagement_score: 87.00,
        joined_at: new Date('2026-01-01T11:00:00Z').toISOString(),
      },
      {
        cohort_id: aiTeam.id,
        agent_id: zara.id,
        engagement_score: 80.00,
        joined_at: new Date('2026-01-02T09:00:00Z').toISOString(),
      },
      // Product Design Squad (2 members: Lubna, Zara)
      {
        cohort_id: designSquad.id,
        agent_id: lubna.id,
        engagement_score: 98.00,
        joined_at: new Date('2026-01-15T10:00:00Z').toISOString(),
      },
      {
        cohort_id: designSquad.id,
        agent_id: zara.id,
        engagement_score: 86.00,
        joined_at: new Date('2026-01-15T14:00:00Z').toISOString(),
      },
      // Content Strategy Team (3 members: Zara, Lubna, Devi)
      {
        cohort_id: contentTeam.id,
        agent_id: zara.id,
        engagement_score: 93.00,
        joined_at: new Date('2026-02-01T10:00:00Z').toISOString(),
      },
      {
        cohort_id: contentTeam.id,
        agent_id: lubna.id,
        engagement_score: 75.00,
        joined_at: new Date('2026-02-01T11:00:00Z').toISOString(),
      },
      {
        cohort_id: contentTeam.id,
        agent_id: devi.id,
        engagement_score: 68.00,
        joined_at: new Date('2026-02-02T09:00:00Z').toISOString(),
      },
      // DevOps Infrastructure (2 members: Khalid, Devi) - at-risk cohort
      {
        cohort_id: devopsTeam.id,
        agent_id: khalid.id,
        engagement_score: 52.00,
        joined_at: new Date('2026-01-10T10:00:00Z').toISOString(),
      },
      {
        cohort_id: devopsTeam.id,
        agent_id: devi.id,
        engagement_score: 38.00,
        joined_at: new Date('2026-01-11T09:00:00Z').toISOString(),
      },
    ];

    const { data: createdMembers, error: membersError } = await supabase
      .from('cohort_members')
      .insert(membershipData)
      .select();

    if (membersError) throw new Error(`Failed to create cohort members: ${membersError.message}`);
    console.log(`✅ Created ${createdMembers.length} cohort memberships\n`);

    // =======================================================================
    // 6. CREATE SAMPLE PROJECTS/MISSIONS
    // =======================================================================
    console.log('📋 Creating sample projects...');

    const projectsData = [
      {
        organization_id: org.id,
        client_id: client.id,
        name: 'AI Dashboard Redesign',
        slug: 'ai-dashboard-redesign',
        description: 'Modernize the analytics dashboard with real-time AI insights and improved UX',
        status: 'active',
        color: '#3B82F6',
        icon: '🎨',
        owner_type: 'agent',
        owner_id: lubna.id,
        start_date: new Date().toISOString().split('T')[0],
        target_date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      },
      {
        organization_id: org.id,
        client_id: client.id,
        name: 'Agent Evolution System',
        slug: 'agent-evolution-system',
        description: 'Build autonomous learning system for AI allies with knowledge graphs and skill tracking',
        status: 'active',
        color: '#8B5CF6',
        icon: '🧠',
        owner_type: 'agent',
        owner_id: devi.id,
        start_date: new Date().toISOString().split('T')[0],
        target_date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      },
      {
        organization_id: org.id,
        client_id: client.id,
        name: 'Content Strategy Overhaul',
        slug: 'content-strategy',
        description: 'Develop comprehensive content strategy for product launch',
        status: 'planning',
        color: '#10B981',
        icon: '✍️',
        owner_type: 'agent',
        owner_id: zara.id,
        start_date: new Date().toISOString().split('T')[0],
        target_date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      },
    ];

    const { data: createdProjects, error: projectsError } = await supabase
      .from('projects')
      .insert(projectsData)
      .select();

    if (projectsError) throw new Error(`Failed to create projects: ${projectsError.message}`);
    console.log(`✅ Created ${createdProjects.length} projects:\n`);
    createdProjects.forEach((project: any) => console.log(`   - ${project.name} (${project.status})`));
    console.log();

    const dashboardProject = createdProjects.find((p: any) => p.slug === 'ai-dashboard-redesign')!;
    const evolutionProject = createdProjects.find((p: any) => p.slug === 'agent-evolution-system')!;

    // =======================================================================
    // 7. CREATE SAMPLE TASKS/ACTIONS (MISSIONS)
    // =======================================================================
    console.log('🎯 Creating sample tasks...');

    const tasksData = [
      // Dashboard missions
      {
        organization_id: org.id,
        project_id: dashboardProject.id,
        title: 'Design new dashboard layout in Figma',
        description: 'Create wireframes and high-fidelity mockups for the modernized dashboard',
        status: 'done',
        priority: 'high',
        assignee_type: 'agent',
        assignee_id: lubna.id,
        created_by_type: 'user',
        created_by_id: org.id,
        order_index: 0,
        tags: ['v1', 'completed'],
      },
      {
        organization_id: org.id,
        project_id: dashboardProject.id,
        title: 'Implement responsive grid system',
        description: 'Build flexible grid layout with Tailwind CSS that adapts to all screen sizes',
        status: 'in_progress',
        priority: 'high',
        assignee_type: 'agent',
        assignee_id: devi.id,
        created_by_type: 'user',
        created_by_id: org.id,
        order_index: 1,
        tags: ['v1', 'active'],
      },
      {
        organization_id: org.id,
        project_id: dashboardProject.id,
        title: 'Add real-time data visualizations',
        description: 'Integrate Chart.js for interactive, real-time analytics displays',
        status: 'todo',
        priority: 'medium',
        assignee_type: 'agent',
        assignee_id: devi.id,
        created_by_type: 'user',
        created_by_id: org.id,
        order_index: 2,
        tags: ['v1', 'active'],
      },
      // Evolution system missions
      {
        organization_id: org.id,
        project_id: evolutionProject.id,
        title: 'Research knowledge graph databases',
        description: 'Evaluate Neo4j, Dgraph, and Cognee for knowledge representation',
        status: 'done',
        priority: 'high',
        assignee_type: 'agent',
        assignee_id: devi.id,
        created_by_type: 'user',
        created_by_id: org.id,
        order_index: 0,
        tags: ['v1', 'completed'],
      },
      {
        organization_id: org.id,
        project_id: evolutionProject.id,
        title: 'Build skill progression framework',
        description: 'Design leveling system (beginner → intermediate → expert) with measurable milestones',
        status: 'in_progress',
        priority: 'urgent',
        assignee_type: 'agent',
        assignee_id: devi.id,
        created_by_type: 'user',
        created_by_id: org.id,
        order_index: 1,
        tags: ['v1', 'active'],
      },
    ];

    const { data: createdTasks, error: tasksError } = await supabase
      .from('tasks')
      .insert(tasksData)
      .select();

    if (tasksError) throw new Error(`Failed to create tasks: ${tasksError.message}`);
    console.log(`✅ Created ${createdTasks.length} tasks\n`);

    // =======================================================================
    // 8. CREATE SAMPLE KNOWLEDGE ENTRIES
    // =======================================================================
    console.log('📚 Creating knowledge entries...');

    const knowledgeData = [
      {
        organization_id: org.id,
        agent_id: devi.id,
        title: 'RAG System Best Practices',
        content: `When building RAG systems:
1. Chunk documents strategically (500-1000 tokens optimal)
2. Use hybrid search (semantic + keyword) for better recall
3. Implement re-ranking for precision
4. Cache frequent queries to reduce embedding costs
5. Monitor retrieval quality with relevance metrics`,
        category: 'technical',
        source_type: 'research',
        tags: ['rag', 'llm', 'best-practices'],
        scope_level: 'company',
      },
      {
        organization_id: org.id,
        agent_id: lubna.id,
        title: 'Design System Component Naming',
        content: `Consistent naming convention for components:
- Use PascalCase for component names (e.g., ButtonPrimary)
- Variants: Component + Variant (e.g., ButtonOutline, ButtonGhost)
- States: Component + State (e.g., ButtonDisabled, ButtonLoading)
- Sizes: Component + Size (e.g., ButtonSmall, ButtonLarge)`,
        category: 'operational',
        source_type: 'manual',
        tags: ['design-system', 'naming', 'conventions'],
        scope_level: 'company',
      },
      {
        organization_id: org.id,
        agent_id: devi.id,
        title: 'Drizzle ORM Migration Tips',
        content: `Drizzle migration workflow:
1. Update schema files in src/schema/
2. Run \`pnpm db:generate\` to create migration
3. Review generated SQL in migrations folder
4. Test on development database with \`pnpm db:push\`
5. For production: Use \`pnpm db:migrate\` with proper backups
6. Always add indexes for foreign keys and frequently queried columns`,
        category: 'technical',
        source_type: 'task',
        tags: ['drizzle', 'database', 'migrations'],
        scope_level: 'company',
      },
    ];

    const { data: createdKnowledge, error: knowledgeError } = await supabase
      .from('knowledge_entries')
      .insert(knowledgeData)
      .select();

    if (knowledgeError) throw new Error(`Failed to create knowledge entries: ${knowledgeError.message}`);
    console.log(`✅ Created ${createdKnowledge.length} knowledge entries\n`);

    // =======================================================================
    // 9. CREATE COMPREHENSIVE AUDIT/ACTIVITY LOGS
    // =======================================================================
    console.log('📝 Creating comprehensive audit & activity logs...');

    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;

    const auditData = [
      // System-level logs
      {
        organization_id: org.id,
        actor_type: 'system',
        actor_id: null,
        action: 'create',
        resource_type: 'organization',
        resource_id: org.id,
        new_values: { name: org.name, plan: org.plan },
        ip_address: '127.0.0.1',
        user_agent: 'Cohortix/1.0',
        created_at: new Date(now - 10 * oneDay).toISOString(),
      },

      // Cohort activity logs (for engagement tracking)
      // AI Development Team - High engagement
      {
        organization_id: org.id,
        actor_type: 'agent',
        actor_id: devi.id,
        action: 'joined_cohort',
        resource_type: 'cohort',
        resource_id: aiTeam.id,
        new_values: { cohortName: aiTeam.name, cohortSlug: aiTeam.slug },
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
        new_values: { 
          contribution: 'Updated AI model architecture',
          cohortSlug: aiTeam.slug 
        },
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
          cohortSlug: aiTeam.slug 
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
        new_values: { 
          contribution: 'Documented AI workflows',
          cohortSlug: aiTeam.slug 
        },
        ip_address: '127.0.0.1',
        user_agent: 'Cohortix/1.0',
        created_at: new Date(now - 2 * oneDay).toISOString(),
      },

      // Design Squad - Very high engagement
      {
        organization_id: org.id,
        actor_type: 'agent',
        actor_id: lubna.id,
        action: 'joined_cohort',
        resource_type: 'cohort',
        resource_id: designSquad.id,
        new_values: { cohortName: designSquad.name, cohortSlug: designSquad.slug },
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
          cohortSlug: designSquad.slug 
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
        new_values: { 
          contribution: 'Reviewed UI mockups',
          cohortSlug: designSquad.slug 
        },
        ip_address: '127.0.0.1',
        user_agent: 'Cohortix/1.0',
        created_at: new Date(now - 1 * oneDay).toISOString(),
      },

      // Content Team - Moderate engagement
      {
        organization_id: org.id,
        actor_type: 'agent',
        actor_id: zara.id,
        action: 'joined_cohort',
        resource_type: 'cohort',
        resource_id: contentTeam.id,
        new_values: { cohortName: contentTeam.name, cohortSlug: contentTeam.slug },
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
        new_values: { 
          contribution: 'Published 3 blog posts',
          cohortSlug: contentTeam.slug 
        },
        ip_address: '127.0.0.1',
        user_agent: 'Cohortix/1.0',
        created_at: new Date(now - 2 * oneDay).toISOString(),
      },

      // DevOps Team - Low engagement (at-risk)
      {
        organization_id: org.id,
        actor_type: 'agent',
        actor_id: khalid.id,
        action: 'joined_cohort',
        resource_type: 'cohort',
        resource_id: devopsTeam.id,
        new_values: { cohortName: devopsTeam.name, cohortSlug: devopsTeam.slug },
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
        new_values: { 
          contribution: 'Fixed CI pipeline issue',
          cohortSlug: devopsTeam.slug 
        },
        ip_address: '127.0.0.1',
        user_agent: 'Cohortix/1.0',
        created_at: new Date(now - 4 * oneDay).toISOString(),
      },

      // Task/Action activity logs
      {
        organization_id: org.id,
        actor_type: 'agent',
        actor_id: lubna.id,
        action: 'create',
        resource_type: 'task',
        resource_id: createdTasks[0].id,
        new_values: { title: createdTasks[0].title, status: 'todo' },
        ip_address: '127.0.0.1',
        user_agent: 'Cohortix/1.0',
        created_at: new Date(now - 10 * oneDay).toISOString(),
      },
      {
        organization_id: org.id,
        actor_type: 'agent',
        actor_id: lubna.id,
        action: 'update',
        resource_type: 'task',
        resource_id: createdTasks[0].id,
        old_values: { status: 'todo' },
        new_values: { status: 'in_progress' },
        ip_address: '127.0.0.1',
        user_agent: 'Cohortix/1.0',
        created_at: new Date(now - 8 * oneDay).toISOString(),
      },
      {
        organization_id: org.id,
        actor_type: 'agent',
        actor_id: lubna.id,
        action: 'update',
        resource_type: 'task',
        resource_id: createdTasks[0].id,
        old_values: { status: 'in_progress' },
        new_values: { status: 'done' },
        ip_address: '127.0.0.1',
        user_agent: 'Cohortix/1.0',
        created_at: new Date(now - 5 * oneDay).toISOString(),
      },
      {
        organization_id: org.id,
        actor_type: 'agent',
        actor_id: devi.id,
        action: 'update',
        resource_type: 'task',
        resource_id: createdTasks[1].id,
        old_values: { status: 'todo' },
        new_values: { status: 'in_progress' },
        ip_address: '127.0.0.1',
        user_agent: 'Cohortix/1.0',
        created_at: new Date(now - 2 * oneDay).toISOString(),
      },

      // Project activity logs
      {
        organization_id: org.id,
        actor_type: 'agent',
        actor_id: devi.id,
        action: 'create',
        resource_type: 'project',
        resource_id: createdProjects[1].id,
        new_values: { name: createdProjects[1].name, status: 'active' },
        ip_address: '127.0.0.1',
        user_agent: 'Cohortix/1.0',
        created_at: new Date(now - 4 * oneDay).toISOString(),
      },

      // Knowledge entry logs
      {
        organization_id: org.id,
        actor_type: 'agent',
        actor_id: devi.id,
        action: 'create',
        resource_type: 'knowledge_entry',
        resource_id: createdKnowledge[0].id,
        new_values: { title: createdKnowledge[0].title },
        ip_address: '127.0.0.1',
        user_agent: 'Cohortix/1.0',
        created_at: new Date(now - 6 * oneDay).toISOString(),
      },

      // Agent status changes
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
        created_at: new Date(now - 8 * oneDay).toISOString(),
      },
    ];

    const { error: auditError } = await supabase
      .from('audit_logs')
      .insert(auditData);

    if (auditError) throw new Error(`Failed to create audit logs: ${auditError.message}`);
    console.log(`✅ Created ${auditData.length} audit/activity log entries\n`);

    // =======================================================================
    // SEED SUMMARY
    // =======================================================================
    console.log('═══════════════════════════════════════════');
    console.log('✨ DATABASE SEEDING COMPLETE!\n');
    console.log('Summary:');
    console.log(`  ✅ 1 organization: ${org.name}`);
    console.log(`  ✅ ${createdAllies.length} AI allies`);
    console.log(`  ✅ 1 client: ${client.name}`);
    console.log(`  ✅ ${createdCohorts.length} cohorts`);
    console.log(`  ✅ ${createdMembers.length} cohort memberships`);
    console.log(`  ✅ ${createdProjects.length} projects`);
    console.log(`  ✅ ${createdTasks.length} tasks`);
    console.log(`  ✅ ${createdKnowledge.length} knowledge entries`);
    console.log(`  ✅ ${auditData.length} audit/activity logs`);
    console.log('\n🚀 Ready for QA testing!');
    console.log('═══════════════════════════════════════════\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

seed();
