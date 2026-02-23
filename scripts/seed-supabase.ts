#!/usr/bin/env tsx
/**
 * Database Seed Script (Supabase Client)
 *
 * Seeds the database with sample data using Supabase client.
 * This works even if direct postgres connection is not available.
 *
 * Run: pnpm tsx scripts/seed-supabase.ts
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

async function seed() {
  console.log('🌱 Seeding database with Supabase client...\n');

  try {
    // 1. Create Demo Organization
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

    if (orgError) {
      console.error('❌ Failed to create organization:', orgError);
      throw orgError;
    }

    console.log(`✅ Created organization: ${org.name} (${org.id})\n`);

    // 2. Create Sample Agents
    console.log('🤖 Creating AI agents...');

    const agents = [
      {
        name: 'Devi',
        slug: 'devi',
        role: 'AI Developer Specialist',
        description: 'Expert in LLM integration, RAG systems, and autonomous agent development.',
        capabilities: ['coding', 'architecture', 'ai-integration', 'testing'],
        status: 'active',
      },
      {
        name: 'Lubna',
        slug: 'lubna',
        role: 'UI/UX Designer',
        description: 'Crafts beautiful, intuitive interfaces with design systems expertise.',
        capabilities: ['design', 'prototyping', 'user-research', 'figma'],
        status: 'active',
      },
      {
        name: 'Zara',
        slug: 'zara',
        role: 'Content Strategist',
        description: 'Creates compelling narratives and strategic content.',
        capabilities: ['writing', 'content-strategy', 'seo', 'documentation'],
        status: 'active',
      },
      {
        name: 'Khalid',
        slug: 'khalid',
        role: 'DevOps Engineer',
        description: 'Builds reliable infrastructure with cloud expertise.',
        capabilities: ['devops', 'cloud-infrastructure', 'ci-cd', 'monitoring'],
        status: 'idle',
      },
    ];

    const { data: createdAgents, error: agentsError } = await supabase
      .from('agents')
      .insert(
        agents.map((agent) => ({
          organization_id: org.id,
          external_id: `clawdbot-${agent.slug}`,
          name: agent.name,
          slug: agent.slug,
          role: agent.role,
          description: agent.description,
          avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${agent.slug}`,
          status: agent.status,
          capabilities: agent.capabilities,
          runtime_type: 'clawdbot',
          runtime_config: {
            modelPreference: 'claude-3-5-sonnet',
            autonomyLevel: 'high',
          },
        }))
      )
      .select();

    if (agentsError) {
      console.error('❌ Failed to create agents:', agentsError);
      throw agentsError;
    }

    console.log(`✅ Created ${createdAgents.length} agents:\n`);
    createdAgents.forEach((agent: any) => console.log(`   - ${agent.name} (${agent.role})`));
    console.log();

    // 3. Create Sample Client
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

    if (clientError) {
      console.error('❌ Failed to create client:', clientError);
      throw clientError;
    }

    console.log(`✅ Created client: ${client.name}\n`);

    // 4. Create Sample Missions (Projects in DB)
    // User-facing terminology: "Mission", database table: "projects"
    console.log('📋 Creating sample missions...');

    const missions = [
      {
        name: 'AI Dashboard Redesign',
        slug: 'ai-dashboard-redesign',
        description: 'Modernize the analytics dashboard with real-time AI insights',
        status: 'active',
        color: '#3B82F6',
        icon: '🎨',
        owner_type: 'agent',
        owner_id: createdAgents.find((a: any) => a.slug === 'lubna')!.id,
      },
      {
        name: 'Agent Evolution System',
        slug: 'agent-evolution-system',
        description: 'Build autonomous learning system for AI agents',
        status: 'active',
        color: '#8B5CF6',
        icon: '🧠',
        owner_type: 'agent',
        owner_id: createdAgents.find((a: any) => a.slug === 'devi')!.id,
      },
      {
        name: 'Content Strategy Overhaul',
        slug: 'content-strategy',
        description: 'Develop comprehensive content strategy for product launch',
        status: 'planning',
        color: '#10B981',
        icon: '✍️',
        owner_type: 'agent',
        owner_id: createdAgents.find((a: any) => a.slug === 'zara')!.id,
      },
    ];

    const { data: createdMissions, error: missionsError } = await supabase
      .from('projects') // Database table name (unchanged for backwards compatibility)
      .insert(
        missions.map((mission) => ({
          organization_id: org.id,
          client_id: client.id,
          name: mission.name,
          slug: mission.slug,
          description: mission.description,
          status: mission.status,
          color: mission.color,
          icon: mission.icon,
          owner_type: mission.owner_type,
          owner_id: mission.owner_id,
          start_date: new Date().toISOString().split('T')[0],
          target_date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        }))
      )
      .select();

    if (missionsError) {
      console.error('❌ Failed to create missions:', missionsError);
      throw missionsError;
    }

    console.log(`✅ Created ${createdMissions.length} missions\n`);

    // 5. Create Sample Actions (Tasks in DB)
    // User-facing terminology: "Action", database table: "tasks"
    console.log('🎯 Creating sample actions...');

    const dashboardMission = createdMissions.find((p: any) => p.slug === 'ai-dashboard-redesign')!;
    const evolutionMission = createdMissions.find((p: any) => p.slug === 'agent-evolution-system')!;

    const actions = [
      {
        project_id: dashboardMission.id,
        title: 'Design new dashboard layout in Figma',
        description: 'Create wireframes and high-fidelity mockups',
        status: 'done',
        priority: 'high',
        assignee_type: 'agent',
        assignee_id: createdAgents.find((a: any) => a.slug === 'lubna')!.id,
      },
      {
        project_id: dashboardMission.id,
        title: 'Implement responsive grid system',
        description: 'Build flexible grid layout with Tailwind CSS',
        status: 'in_progress',
        priority: 'high',
        assignee_type: 'agent',
        assignee_id: createdAgents.find((a: any) => a.slug === 'devi')!.id,
      },
      {
        project_id: dashboardMission.id,
        title: 'Add real-time data visualizations',
        description: 'Integrate Chart.js for interactive analytics',
        status: 'todo',
        priority: 'medium',
        assignee_type: 'agent',
        assignee_id: createdAgents.find((a: any) => a.slug === 'devi')!.id,
      },
      {
        project_id: evolutionMission.id,
        title: 'Research knowledge graph databases',
        description: 'Evaluate Neo4j, Dgraph, and Cognee',
        status: 'done',
        priority: 'high',
        assignee_type: 'agent',
        assignee_id: createdAgents.find((a: any) => a.slug === 'devi')!.id,
      },
      {
        project_id: evolutionMission.id,
        title: 'Build skill progression framework',
        description: 'Design leveling system with measurable milestones',
        status: 'in_progress',
        priority: 'urgent',
        assignee_type: 'agent',
        assignee_id: createdAgents.find((a: any) => a.slug === 'devi')!.id,
      },
    ];

    const { data: createdActions, error: actionsError } = await supabase
      .from('tasks') // Database table name (unchanged for backwards compatibility)
      .insert(
        actions.map((action, index) => ({
          organization_id: org.id,
          project_id: action.project_id,
          title: action.title,
          description: action.description,
          status: action.status,
          priority: action.priority,
          assignee_type: action.assignee_type,
          assignee_id: action.assignee_id,
          created_by_type: 'user',
          created_by_id: org.id, // Placeholder
          order_index: index,
          tags: ['v1', action.status === 'done' ? 'completed' : 'active'],
        }))
      )
      .select();

    if (actionsError) {
      console.error('❌ Failed to create actions:', actionsError);
      throw actionsError;
    }

    console.log(`✅ Created ${createdActions.length} actions\n`);

    // 6. Create Sample Knowledge Entries
    console.log('📚 Creating knowledge entries...');

    const knowledgeData = [
      {
        agent_id: createdAgents.find((a: any) => a.slug === 'devi')!.id,
        title: 'RAG System Best Practices',
        content:
          'When building RAG systems: chunk strategically, use hybrid search, implement re-ranking...',
        category: 'technical',
        source_type: 'research',
        tags: ['rag', 'llm', 'best-practices'],
        scope_level: 'company',
      },
      {
        agent_id: createdAgents.find((a: any) => a.slug === 'lubna')!.id,
        title: 'Design System Component Naming',
        content: 'Use PascalCase for component names, consistent variant patterns...',
        category: 'operational',
        source_type: 'manual',
        tags: ['design-system', 'naming'],
        scope_level: 'company',
      },
    ];

    const { data: createdKnowledge, error: knowledgeError } = await supabase
      .from('knowledge_entries')
      .insert(
        knowledgeData.map((entry) => ({
          organization_id: org.id,
          agent_id: entry.agent_id,
          title: entry.title,
          content: entry.content,
          category: entry.category,
          source_type: entry.source_type,
          tags: entry.tags,
          scope_level: entry.scope_level,
        }))
      )
      .select();

    if (knowledgeError) {
      console.error('❌ Failed to create knowledge:', knowledgeError);
      throw knowledgeError;
    }

    console.log(`✅ Created ${createdKnowledge.length} knowledge entries\n`);

    // 7. Create Sample Audit Logs (Activity Feed)
    console.log('📝 Creating audit log entries...');

    const auditLogs = [
      {
        organization_id: org.id,
        actor_type: 'agent',
        actor_id: createdAgents.find((a: any) => a.slug === 'devi')!.id,
        event_type: 'task.completed',
        event_data: {
          task_id: createdActions[0].id,
          task_title: createdActions[0].title,
        },
        ip_address: '127.0.0.1',
        created_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 min ago
      },
      {
        organization_id: org.id,
        actor_type: 'agent',
        actor_id: createdAgents.find((a: any) => a.slug === 'lubna')!.id,
        event_type: 'task.updated',
        event_data: {
          task_id: createdActions[1].id,
          task_title: createdActions[1].title,
          changes: { status: 'in_progress' },
        },
        ip_address: '127.0.0.1',
        created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
      },
      {
        organization_id: org.id,
        actor_type: 'agent',
        actor_id: createdAgents.find((a: any) => a.slug === 'devi')!.id,
        event_type: 'project.created',
        event_data: {
          project_id: evolutionMission.id,
          project_name: evolutionMission.name,
        },
        ip_address: '127.0.0.1',
        created_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), // 4 hours ago
      },
      {
        organization_id: org.id,
        actor_type: 'agent',
        actor_id: createdAgents.find((a: any) => a.slug === 'zara')!.id,
        event_type: 'knowledge.created',
        event_data: {
          knowledge_id: createdKnowledge[0].id,
          title: createdKnowledge[0].title,
        },
        ip_address: '127.0.0.1',
        created_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(), // 6 hours ago
      },
      {
        organization_id: org.id,
        actor_type: 'agent',
        actor_id: createdAgents.find((a: any) => a.slug === 'khalid')!.id,
        event_type: 'agent.status_changed',
        event_data: {
          agent_id: createdAgents.find((a: any) => a.slug === 'khalid')!.id,
          status: 'idle',
        },
        ip_address: '127.0.0.1',
        created_at: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(), // 8 hours ago
      },
    ];

    const { data: createdAuditLogs, error: auditError } = await supabase
      .from('audit_logs')
      .insert(auditLogs)
      .select();

    if (auditError) {
      console.error('❌ Failed to create audit logs:', auditError);
      throw auditError;
    }

    console.log(`✅ Created ${createdAuditLogs.length} audit log entries\n`);

    // Summary
    console.log('═══════════════════════════════════════════');
    console.log('✨ Database seeding complete!\n');
    console.log('Summary:');
    console.log(`  • 1 organization: ${org.name}`);
    console.log(`  • ${createdAgents.length} AI agents`);
    console.log(`  • ${createdMissions.length} missions`);
    console.log(`  • ${createdActions.length} actions`);
    console.log(`  • ${createdKnowledge.length} knowledge entries`);
    console.log(`  • ${createdAuditLogs.length} audit log entries`);
    console.log('\n🚀 Ready to develop!');
    console.log('═══════════════════════════════════════════\n');
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

seed();
