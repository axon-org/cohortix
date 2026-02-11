#!/usr/bin/env tsx

/**
 * Database Seed Script
 * 
 * Seeds the database with sample data for development:
 * - Demo organization "Axon HQ"
 * - Sample AI allies (Devi, Lubna, Zara, etc.)
 * - Sample cohorts/projects with missions
 * - Sample activity/audit log entries
 * 
 * Run: pnpm db:seed (or tsx scripts/seed-db.ts)
 */

import { db } from '../packages/database/src/client';
import {
  organizations,
  profiles,
  organizationMemberships,
  agents,
  clients,
  projects,
  tasks,
  knowledgeEntries,
  auditLogs,
} from '../packages/database/src/schema';

async function seed() {
  console.log('🌱 Seeding database...\n');

  try {
    // 1. Create Demo Organization
    console.log('📦 Creating organization: Axon HQ');
    const [org] = await db
      .insert(organizations)
      .values({
        name: 'Axon HQ',
        slug: 'axon-hq',
        logoUrl: 'https://api.dicebear.com/7.x/shapes/svg?seed=axon',
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
      .returning();

    console.log(`✅ Created organization: ${org.name} (${org.id})\n`);

    // 2. Create Sample Allies
    console.log('🤖 Creating AI allies...');
    
    const allies = [
      {
        name: 'Devi',
        slug: 'devi',
        role: 'AI Developer Specialist',
        description: 'Expert in LLM integration, RAG systems, and autonomous agent development. Specializes in Python, TypeScript, and AI frameworks.',
        capabilities: ['coding', 'architecture', 'ai-integration', 'testing'],
        status: 'active' as const,
      },
      {
        name: 'Lubna',
        slug: 'lubna',
        role: 'UI/UX Designer',
        description: 'Crafts beautiful, intuitive interfaces with deep expertise in design systems, accessibility, and user research.',
        capabilities: ['design', 'prototyping', 'user-research', 'figma'],
        status: 'active' as const,
      },
      {
        name: 'Zara',
        slug: 'zara',
        role: 'Content Strategist',
        description: 'Creates compelling narratives and strategic content. Expert in technical writing, SEO, and content operations.',
        capabilities: ['writing', 'content-strategy', 'seo', 'documentation'],
        status: 'active' as const,
      },
      {
        name: 'Khalid',
        slug: 'khalid',
        role: 'DevOps Engineer',
        description: 'Builds reliable infrastructure with expertise in cloud platforms, CI/CD, and monitoring systems.',
        capabilities: ['devops', 'cloud-infrastructure', 'ci-cd', 'monitoring'],
        status: 'idle' as const,
      },
    ];

    const createdAllies = await db
      .insert(agents)
      .values(
        allies.map((ally) => ({
          organizationId: org.id,
          externalId: `clawdbot-${ally.slug}`,
          name: ally.name,
          slug: ally.slug,
          role: ally.role,
          description: ally.description,
          avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${ally.slug}`,
          status: ally.status,
          capabilities: ally.capabilities,
          runtimeType: 'clawdbot',
          runtimeConfig: {
            modelPreference: 'claude-3-5-sonnet',
            autonomyLevel: 'high',
          },
        }))
      )
      .returning();

    console.log(`✅ Created ${createdAllies.length} allies:\n`);
    createdAllies.forEach((ally) => console.log(`   - ${ally.name} (${ally.role})`));
    console.log();

    // 3. Create Sample Client
    console.log('🏢 Creating sample client...');
    const [client] = await db
      .insert(clients)
      .values({
        organizationId: org.id,
        name: 'TechCorp Inc.',
        slug: 'techcorp',
        description: 'Leading enterprise software company',
        industry: 'technology',
        contactName: 'Sarah Johnson',
        contactEmail: 'sarah@techcorp.com',
        metadata: {
          employees: '500-1000',
          revenue: '$50M-$100M',
          region: 'North America',
        },
      })
      .returning();

    console.log(`✅ Created client: ${client.name}\n`);

    // 4. Create Sample Cohorts/Projects
    console.log('📋 Creating sample cohorts...');

    const cohorts = [
      {
        name: 'AI Dashboard Redesign',
        slug: 'ai-dashboard-redesign',
        description: 'Modernize the analytics dashboard with real-time AI insights and improved UX',
        status: 'active' as const,
        color: '#3B82F6',
        icon: '🎨',
        ownerType: 'agent' as const,
        ownerId: createdAllies.find((a) => a.slug === 'lubna')!.id,
      },
      {
        name: 'Agent Evolution System',
        slug: 'agent-evolution-system',
        description: 'Build autonomous learning system for AI allies with knowledge graphs and skill tracking',
        status: 'active' as const,
        color: '#8B5CF6',
        icon: '🧠',
        ownerType: 'agent' as const,
        ownerId: createdAllies.find((a) => a.slug === 'devi')!.id,
      },
      {
        name: 'Content Strategy Overhaul',
        slug: 'content-strategy',
        description: 'Develop comprehensive content strategy for product launch',
        status: 'planning' as const,
        color: '#10B981',
        icon: '✍️',
        ownerType: 'agent' as const,
        ownerId: createdAllies.find((a) => a.slug === 'zara')!.id,
      },
    ];

    const createdProjects = await db
      .insert(projects)
      .values(
        cohorts.map((cohort) => ({
          organizationId: org.id,
          clientId: client.id,
          name: cohort.name,
          slug: cohort.slug,
          description: cohort.description,
          status: cohort.status,
          color: cohort.color,
          icon: cohort.icon,
          ownerType: cohort.ownerType,
          ownerId: cohort.ownerId,
          startDate: new Date().toISOString().split('T')[0],
          targetDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        }))
      )
      .returning();

    console.log(`✅ Created ${createdProjects.length} cohorts:\n`);
    createdProjects.forEach((project) => console.log(`   - ${project.name} (${project.status})`));
    console.log();

    // 5. Create Sample Missions/Tasks
    console.log('🎯 Creating sample missions...');

    const dashboardProject = createdProjects.find((p) => p.slug === 'ai-dashboard-redesign')!;
    const evolutionProject = createdProjects.find((p) => p.slug === 'agent-evolution-system')!;

    const missions = [
      // Dashboard missions
      {
        projectId: dashboardProject.id,
        title: 'Design new dashboard layout in Figma',
        description: 'Create wireframes and high-fidelity mockups for the modernized dashboard',
        status: 'done' as const,
        priority: 'high' as const,
        assigneeType: 'agent' as const,
        assigneeId: createdAllies.find((a) => a.slug === 'lubna')!.id,
      },
      {
        projectId: dashboardProject.id,
        title: 'Implement responsive grid system',
        description: 'Build flexible grid layout with Tailwind CSS that adapts to all screen sizes',
        status: 'in_progress' as const,
        priority: 'high' as const,
        assigneeType: 'agent' as const,
        assigneeId: createdAllies.find((a) => a.slug === 'devi')!.id,
      },
      {
        projectId: dashboardProject.id,
        title: 'Add real-time data visualizations',
        description: 'Integrate Chart.js for interactive, real-time analytics displays',
        status: 'todo' as const,
        priority: 'medium' as const,
        assigneeType: 'agent' as const,
        assigneeId: createdAllies.find((a) => a.slug === 'devi')!.id,
      },
      // Evolution system missions
      {
        projectId: evolutionProject.id,
        title: 'Research knowledge graph databases',
        description: 'Evaluate Neo4j, Dgraph, and Cognee for knowledge representation',
        status: 'done' as const,
        priority: 'high' as const,
        assigneeType: 'agent' as const,
        assigneeId: createdAllies.find((a) => a.slug === 'devi')!.id,
      },
      {
        projectId: evolutionProject.id,
        title: 'Build skill progression framework',
        description: 'Design leveling system (beginner → intermediate → expert) with measurable milestones',
        status: 'in_progress' as const,
        priority: 'urgent' as const,
        assigneeType: 'agent' as const,
        assigneeId: createdAllies.find((a) => a.slug === 'devi')!.id,
      },
    ];

    const createdTasks = await db
      .insert(tasks)
      .values(
        missions.map((mission, index) => ({
          organizationId: org.id,
          projectId: mission.projectId,
          title: mission.title,
          description: mission.description,
          status: mission.status,
          priority: mission.priority,
          assigneeType: mission.assigneeType,
          assigneeId: mission.assigneeId,
          createdByType: 'user' as const,
          createdById: org.id, // Placeholder
          orderIndex: index,
          tags: ['v1', mission.status === 'done' ? 'completed' : 'active'],
        }))
      )
      .returning();

    console.log(`✅ Created ${createdTasks.length} missions\n`);

    // 6. Create Sample Knowledge Entries
    console.log('📚 Creating knowledge entries...');

    const knowledgeData = [
      {
        agentId: createdAllies.find((a) => a.slug === 'devi')!.id,
        title: 'RAG System Best Practices',
        content: `When building RAG systems:
1. Chunk documents strategically (500-1000 tokens optimal)
2. Use hybrid search (semantic + keyword) for better recall
3. Implement re-ranking for precision
4. Cache frequent queries to reduce embedding costs
5. Monitor retrieval quality with relevance metrics`,
        category: 'technical' as const,
        sourceType: 'research' as const,
        tags: ['rag', 'llm', 'best-practices'],
        scopeLevel: 'company' as const,
      },
      {
        agentId: createdAllies.find((a) => a.slug === 'lubna')!.id,
        title: 'Design System Component Naming',
        content: `Consistent naming convention for components:
- Use PascalCase for component names (e.g., ButtonPrimary)
- Variants: Component + Variant (e.g., ButtonOutline, ButtonGhost)
- States: Component + State (e.g., ButtonDisabled, ButtonLoading)
- Sizes: Component + Size (e.g., ButtonSmall, ButtonLarge)`,
        category: 'operational' as const,
        sourceType: 'manual' as const,
        tags: ['design-system', 'naming', 'conventions'],
        scopeLevel: 'company' as const,
      },
      {
        agentId: createdAllies.find((a) => a.slug === 'devi')!.id,
        title: 'Drizzle ORM Migration Tips',
        content: `Drizzle migration workflow:
1. Update schema files in src/schema/
2. Run \`pnpm db:generate\` to create migration
3. Review generated SQL in migrations folder
4. Test on development database with \`pnpm db:push\`
5. For production: Use \`pnpm db:migrate\` with proper backups
6. Always add indexes for foreign keys and frequently queried columns`,
        category: 'technical' as const,
        sourceType: 'task' as const,
        tags: ['drizzle', 'database', 'migrations'],
        scopeLevel: 'company' as const,
      },
    ];

    const createdKnowledge = await db
      .insert(knowledgeEntries)
      .values(
        knowledgeData.map((entry) => ({
          organizationId: org.id,
          agentId: entry.agentId,
          title: entry.title,
          content: entry.content,
          category: entry.category,
          sourceType: entry.sourceType,
          tags: entry.tags,
          scopeLevel: entry.scopeLevel,
        }))
      )
      .returning();

    console.log(`✅ Created ${createdKnowledge.length} knowledge entries\n`);

    // 7. Create Sample Audit Logs
    console.log('📝 Creating audit logs...');

    const auditData = [
      {
        organizationId: org.id,
        actorType: 'agent' as const,
        actorId: createdAllies[0].id,
        action: 'create',
        resourceType: 'task',
        resourceId: createdTasks[0].id,
        newValues: { title: createdTasks[0].title, status: 'todo' },
      },
      {
        organizationId: org.id,
        actorType: 'agent' as const,
        actorId: createdAllies[0].id,
        action: 'update',
        resourceType: 'task',
        resourceId: createdTasks[0].id,
        oldValues: { status: 'todo' },
        newValues: { status: 'done' },
      },
      {
        organizationId: org.id,
        actorType: 'system' as const,
        actorId: null,
        action: 'create',
        resourceType: 'organization',
        resourceId: org.id,
        newValues: { name: org.name, plan: org.plan },
      },
    ];

    await db.insert(auditLogs).values(auditData);

    console.log('✅ Created audit log entries\n');

    // Summary
    console.log('═══════════════════════════════════════════');
    console.log('✨ Database seeding complete!\n');
    console.log('Summary:');
    console.log(`  • 1 organization: ${org.name}`);
    console.log(`  • ${createdAllies.length} AI allies`);
    console.log(`  • ${createdProjects.length} cohorts/projects`);
    console.log(`  • ${createdTasks.length} missions/tasks`);
    console.log(`  • ${createdKnowledge.length} knowledge entries`);
    console.log(`  • 3 audit log entries`);
    console.log('\n🚀 Ready to develop!');
    console.log('═══════════════════════════════════════════\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

seed();
