#!/usr/bin/env tsx
/**
 * Apply Cohorts Migrations using node-postgres
 */

import postgres from 'postgres';
import { readFileSync } from 'fs';
import { join } from 'path';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error(
    '❌ DATABASE_URL not found. Set it in your environment before running this script.'
  );
  process.exit(1);
}

async function main() {
  console.log('🚀 Applying Cohortix Cohorts Migrations\n');

  const sql = postgres(connectionString, {
    max: 1,
    ssl: 'require',
  });

  try {
    const migrationsDir = join(process.cwd(), 'packages/database/src/migrations');

    // Check if cohorts table exists
    console.log('🔍 Checking if cohorts table exists...');
    try {
      const result = await sql`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'cohorts'
        ) as exists
      `;

      if (result[0].exists) {
        console.log('⚠️  Cohorts table already exists!\n');
        console.log('✅ Applying RLS policies (idempotent)...');

        const rlsSql = readFileSync(join(migrationsDir, '0002_cohorts_rls_policies.sql'), 'utf-8');
        await sql.unsafe(rlsSql);
        console.log('✅ RLS policies applied successfully!');

        await sql.end();
        console.log('\n✨ All migrations are up to date!');
        return;
      }
    } catch (e) {
      console.log('Table does not exist, proceeding with migrations...\n');
    }

    // Apply migration 0001
    console.log('📄 Applying 0001_thin_hardball.sql (Create Cohorts Table)...');
    const migration1 = readFileSync(join(migrationsDir, '0001_thin_hardball.sql'), 'utf-8');
    await sql.unsafe(migration1);
    console.log('✅ Cohorts table created successfully!');

    // Apply migration 0002
    console.log('\n📄 Applying 0002_cohorts_rls_policies.sql (Add RLS Policies)...');
    const migration2 = readFileSync(join(migrationsDir, '0002_cohorts_rls_policies.sql'), 'utf-8');
    await sql.unsafe(migration2);
    console.log('✅ RLS policies applied successfully!');

    // Verify
    console.log('\n🔍 Verifying cohorts table...');
    const verify = await sql`SELECT COUNT(*) as count FROM cohorts`;
    console.log(`✅ Cohorts table verified! (${verify[0].count} records)`);

    await sql.end();

    console.log('\n✨ Migrations completed successfully!');
    console.log('\n📋 Next steps:');
    console.log('   1. Run: pnpm tsx scripts/seed-supabase.ts');
    console.log('   2. Start frontend: pnpm dev');
  } catch (error) {
    console.error('\n💥 Migration failed:', error);
    await sql.end();
    process.exit(1);
  }
}

main();
