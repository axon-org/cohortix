#!/usr/bin/env tsx
/**
 * Apply Cohorts Table Migrations
 *
 * Applies pending migrations:
 * - 0001_thin_hardball.sql (creates cohorts table)
 * - 0002_cohorts_rls_policies.sql (adds RLS policies)
 *
 * Run: pnpm tsx scripts/apply-cohorts-migrations.ts
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://rfwscvklcokzuofyzqwx.supabase.co';
const serviceRoleKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJmd3NjdmtsY29renVvZnl6cXd4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDcyNDYyNCwiZXhwIjoyMDg2MzAwNjI0fQ.DtEf0p3b_tBCvzO5g3Al6QqCkDg-Y8K6-xRI4rcKqNM';

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
  db: {
    schema: 'public',
  },
});

async function executeSQLFile(filePath: string, description: string) {
  console.log(`\n📄 ${description}`);
  console.log(`   File: ${filePath}`);

  const sql = readFileSync(filePath, 'utf-8');

  // Execute via REST API POST endpoint
  const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      Prefer: 'return=minimal',
    },
    body: JSON.stringify({ sql }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error(`❌ Failed: ${error}`);
    throw new Error(`Migration failed: ${error}`);
  }

  console.log('✅ Applied successfully!');
}

async function verifyCohortsTable() {
  console.log('\n🔍 Verifying cohorts table...');

  const { data, error } = await supabase.from('cohorts').select('id').limit(1);

  if (error) {
    console.error('❌ Verification failed:', error.message);
    return false;
  }

  console.log('✅ Cohorts table exists and is accessible!');
  return true;
}

async function main() {
  console.log('🚀 Applying Cohortix Database Migrations\n');
  console.log(`📍 Supabase URL: ${supabaseUrl}`);

  const migrationsDir = join(process.cwd(), 'packages/database/src/migrations');

  try {
    // Check if cohorts table already exists
    const { error: checkError } = await supabase.from('cohorts').select('id').limit(1);

    if (!checkError) {
      console.log('\n⚠️  Cohorts table already exists. Checking for RLS policies...');

      // Still apply RLS policies migration (it has IF NOT EXISTS checks)
      await executeSQLFile(
        join(migrationsDir, '0002_cohorts_rls_policies.sql'),
        'Applying RLS Policies for Cohorts'
      );

      console.log('\n✨ All migrations are up to date!');
      return;
    }

    // Apply migration 0001: Create cohorts table
    await executeSQLFile(join(migrationsDir, '0001_thin_hardball.sql'), 'Creating Cohorts Table');

    // Apply migration 0002: Add RLS policies
    await executeSQLFile(
      join(migrationsDir, '0002_cohorts_rls_policies.sql'),
      'Adding RLS Policies for Cohorts'
    );

    // Verify
    const verified = await verifyCohortsTable();

    if (verified) {
      console.log('\n✨ Migrations completed successfully!');
      console.log('\n📋 Next steps:');
      console.log('   1. Run: pnpm tsx scripts/seed-supabase.ts');
      console.log('   2. Start frontend: pnpm dev');
    } else {
      throw new Error('Verification failed');
    }
  } catch (error) {
    console.error('\n💥 Migration failed:', error);
    process.exit(1);
  }
}

main();
