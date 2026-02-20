/**
 * Direct Migration Executor
 *
 * Executes migration SQL using fetch to Supabase's REST API
 * This bypasses the need for psql or custom RPC functions
 */

import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error(
    'Missing required env vars: NEXT_PUBLIC_SUPABASE_URL and/or SUPABASE_SERVICE_ROLE_KEY'
  );
}

async function executeSql(sql: string) {
  const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/rpc/exec_sql`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
      Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY!}`,
    },
    body: JSON.stringify({ query: sql }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`SQL execution failed: ${error}`);
  }

  return response.json();
}

async function main() {
  const migrationPath =
    process.argv[2] || 'supabase/migrations/20260213185300_create_missions_table.sql';

  console.log(`📦 Executing migration: ${migrationPath}\n`);

  const fullPath = path.resolve(migrationPath);

  if (!fs.existsSync(fullPath)) {
    console.error(`❌ Migration file not found: ${fullPath}`);
    process.exit(1);
  }

  const sql = fs.readFileSync(fullPath, 'utf-8');

  console.log('🚀 Executing SQL...\n');

  try {
    await executeSql(sql);
    console.log('✅ Migration completed successfully!');
  } catch (error: any) {
    console.error('❌ Migration failed:', error.message);
    console.log('\n📝 Please run the migration manually via Supabase SQL Editor:');
    console.log(`   https://supabase.com/dashboard/project/qobvewyakovekbuvwjkt/sql/new`);
    console.log('\n   See MIGRATION_INSTRUCTIONS.md for details.');
    process.exit(1);
  }
}

main();
