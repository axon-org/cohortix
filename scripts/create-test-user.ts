#!/usr/bin/env tsx
/**
 * Create Test User for QA
 *
 * Creates a test user in Supabase Auth and links to organization
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://rfwscvklcokzuofyzqwx.supabase.co';
const serviceRoleKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJmd3NjdmtsY29renVvZnl6cXd4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDcyNDYyNCwiZXhwIjoyMDg2MzAwNjI0fQ.DtEf0p3b_tBCvzO5g3Al6QqCkDg-Y8K6-xRI4rcKqNM';

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function createTestUser() {
  console.log('🔐 Creating test user for QA...\n');

  try {
    // Try to create auth user, or get existing
    let authData;
    const createResult = await supabase.auth.admin.createUser({
      email: 'test@cohortix.dev',
      password: 'TestPass123!',
      email_confirm: true,
    });

    if (createResult.error && createResult.error.code === 'email_exists') {
      console.log('ℹ️  User already exists, fetching...\n');

      // List users and find ours
      const { data: users } = await supabase.auth.admin.listUsers();
      const existingUser = users?.users.find((u) => u.email === 'test@cohortix.dev');

      if (!existingUser) {
        throw new Error('User exists but could not be found');
      }

      authData = { user: existingUser };
      console.log(`✅ Found existing user: ${authData.user.email} (${authData.user.id})\n`);
    } else if (createResult.error) {
      console.error('❌ Failed to create auth user:', createResult.error);
      throw createResult.error;
    } else {
      authData = createResult.data;
      console.log(`✅ Created auth user: ${authData.user.email} (${authData.user.id})\n`);
    }

    // Get existing organization (Axon HQ from seed)
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .select('*')
      .eq('slug', 'axon-hq')
      .single();

    if (orgError || !org) {
      console.error('❌ Organization not found. Please run seed script first.');
      console.log('   Run: cd ~/Projects/cohortix && pnpm db:seed');
      throw new Error('Organization not found');
    }

    console.log(`📦 Found organization: ${org.name} (${org.id})\n`);

    // Create profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: authData.user.id,
        email: authData.user.email,
        name: 'Test User',
        avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=test',
      })
      .select()
      .single();

    if (profileError) {
      console.error('❌ Failed to create profile:', profileError);
      throw profileError;
    }

    console.log(`✅ Created profile for: ${profile.name}\n`);

    // Create organization membership
    const { data: membership, error: membershipError } = await supabase
      .from('organization_memberships')
      .insert({
        user_id: authData.user.id,
        organization_id: org.id,
        role: 'admin',
      })
      .select()
      .single();

    if (membershipError) {
      console.error('❌ Failed to create membership:', membershipError);
      throw membershipError;
    }

    console.log(`✅ Added user to organization with role: ${membership.role}\n`);

    console.log('═══════════════════════════════════════════');
    console.log('✨ Test user created successfully!\n');
    console.log('Login Credentials:');
    console.log('  Email: test@cohortix.dev');
    console.log('  Password: TestPass123!');
    console.log('\n🚀 You can now sign in at http://localhost:3000/sign-in');
    console.log('═══════════════════════════════════════════\n');
  } catch (error) {
    console.error('❌ Failed to create test user:', error);
    process.exit(1);
  }
}

createTestUser();
