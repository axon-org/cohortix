import { createClient } from '@supabase/supabase-js'

// Hardcoded for quick testing
const SUPABASE_URL = 'https://rfwscvklcokzuofyzqwx.supabase.co'
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJmd3NjdmtsY29renVvZnl6cXd4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDcyNDYyNCwiZXhwIjoyMDg2MzAwNjI0fQ.DtEf0p3b_tBCvzO5g3Al6QqCkDg-Y8K6-xRI4rcKqNM'

const supabase = createClient(
  SUPABASE_URL,
  SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

async function seedCohorts() {
  console.log('🌱 Seeding cohorts...\n')
  
  // Get organization ID
  const { data: org } = await supabase
    .from('organizations')
    .select('id')
    .single()
  
  if (!org) {
    console.error('❌ No organization found')
    return
  }
  
  const orgId = org.id
  console.log(`📦 Using organization: ${orgId}\n`)
  
  const dummyUserId = '00000000-0000-0000-0000-000000000000'

  // Create cohorts
  const cohorts = [
    {
      organization_id: orgId,
      name: 'AI Development Team',
      slug: 'ai-development-team',
      description: 'Core AI development cohort focused on machine learning and agent systems',
      status: 'active',
      start_date: '2026-01-01',
      end_date: null,
      member_count: 5,
      engagement_percent: 87.5,
      created_by: dummyUserId,
      settings: {}
    },
    {
      organization_id: orgId,
      name: 'Product Design Squad',
      slug: 'product-design-squad',
      description: 'UI/UX designers working on product experience and visual design',
      status: 'active',
      start_date: '2026-01-15',
      end_date: null,
      member_count: 3,
      engagement_percent: 92.3,
      created_by: dummyUserId,
      settings: {}
    },
    {
      organization_id: orgId,
      name: 'Content Strategy Team',
      slug: 'content-strategy-team',
      description: 'Content creators and strategists managing documentation and marketing',
      status: 'active',
      start_date: '2026-02-01',
      end_date: null,
      member_count: 4,
      engagement_percent: 78.5,
      created_by: dummyUserId,
      settings: {}
    },
    {
      organization_id: orgId,
      name: 'DevOps Infrastructure',
      slug: 'devops-infrastructure',
      description: 'DevOps team maintaining cloud infrastructure and CI/CD pipelines',
      status: 'at-risk',
      start_date: '2026-01-10',
      end_date: null,
      member_count: 2,
      engagement_percent: 45.2,
      created_by: dummyUserId,
      settings: {}
    }
  ]
  
  for (const cohort of cohorts) {
    console.log(`📝 Creating cohort: ${cohort.name}`)
    const { error } = await supabase
      .from('cohorts')
      .insert(cohort)
    
    if (error) {
      console.error(`❌ Error: ${error.message}`)
    } else {
      console.log(`✅ Created: ${cohort.name}`)
    }
  }
  
  console.log('\n✨ Cohorts seeded successfully!')
}

seedCohorts().catch(console.error)
