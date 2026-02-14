/**
 * Migration Runner
 *
 * Applies SQL migration files to Supabase
 *
 * Run with: pnpm tsx scripts/run-migration.ts <migration-file>
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

async function runMigration(migrationPath: string) {
  console.log(`📦 Running migration: ${migrationPath}\n`);

  // Read migration file
  const fullPath = path.resolve(migrationPath);

  if (!fs.existsSync(fullPath)) {
    console.error(`❌ Migration file not found: ${fullPath}`);
    process.exit(1);
  }

  const sql = fs.readFileSync(fullPath, 'utf-8');

  console.log('SQL Preview:');
  console.log('─'.repeat(80));
  console.log(sql.substring(0, 500));
  console.log('─'.repeat(80));
  console.log('\n🚀 Executing migration...\n');

  // Execute migration
  const { error } = await supabase.rpc('exec_sql', { sql_string: sql }).select();

  if (error) {
    // If the rpc function doesn't exist, try direct query
    console.log('⚠️  RPC method not available, trying direct query...\n');

    const { error: queryError } = await (supabase as any).rpc('query', { query_text: sql });

    if (queryError) {
      console.error('❌ Migration failed:', queryError);
      process.exit(1);
    }
  }

  console.log('✅ Migration completed successfully!\n');
}

const migrationFile = process.argv[2];

if (!migrationFile) {
  console.error('❌ Usage: pnpm tsx scripts/run-migration.ts <migration-file>');
  console.error(
    '   Example: pnpm tsx scripts/run-migration.ts supabase/migrations/20260213185300_create_missions_table.sql'
  );
  process.exit(1);
}

runMigration(migrationFile)
  .then(() => {
    console.log('✅ Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  });
