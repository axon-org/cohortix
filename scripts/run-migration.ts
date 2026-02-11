import postgres from 'postgres';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// Get direct URL from environment - use pooler as fallback
const directUrl = process.env.DATABASE_URL || 'postgresql://postgres.rfwscvklcokzuofyzqwx:c1wGxCYcgHa4kXulaeCrE6qqeZbB9@aws-0-us-east-1.pooler.supabase.com:6543/postgres';

if (!directUrl) {
  console.error('❌ DIRECT_URL not found in .env.local');
  process.exit(1);
}

console.log('🔌 Connecting to Supabase database...\n');

const sql = postgres(directUrl, {
  max: 1,
  ssl: 'require',
});

async function runMigration() {
  try {
    console.log('📖 Reading migration file...');
    const migrationPath = resolve(
      process.cwd(),
      'packages/database/src/migrations/0000_initial_with_rls.sql'
    );
    const migrationSQL = readFileSync(migrationPath, 'utf-8');

    console.log('✅ Migration file loaded\n');
    console.log('🚀 Running migration (this may take a minute)...\n');

    // Execute the entire migration
    await sql.unsafe(migrationSQL);

    console.log('✅ Migration completed successfully!\n');
    console.log('📊 Database schema is now set up with:');
    console.log('   • 16 tables');
    console.log('   • 14 enum types');
    console.log('   • Row-Level Security policies');
    console.log('   • Indexes and constraints\n');

    await sql.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    await sql.end();
    process.exit(1);
  }
}

runMigration();
