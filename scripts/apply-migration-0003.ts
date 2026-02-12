import postgres from 'postgres';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const directUrl = process.env.DIRECT_URL || 'postgresql://postgres.rfwscvklcokzuofyzqwx:c1wGxCYcgHa4kXulaeCrE6qqeZbB9@db.rfwscvklcokzuofyzqwx.supabase.co:5432/postgres';

console.log('🔌 Connecting to Supabase (direct connection)...\n');

const sql = postgres(directUrl, {
  max: 1,
  ssl: 'require',
});

async function run() {
  try {
    console.log('📖 Reading migration 0003...');
    const migrationSQL = readFileSync(resolve(process.cwd(), 'migrations/0003_cohort_members_table.sql'), 'utf-8');
    
    console.log('✅ Migration file loaded\n');
    console.log('🚀 Applying migration 0003_cohort_members_table...\n');
    
    await sql.unsafe(migrationSQL);
    
    console.log('✅ Migration 0003 completed successfully!\n');
    
    // Verify
    const result = await sql`SELECT column_name FROM information_schema.columns WHERE table_name = 'cohort_members' ORDER BY ordinal_position`;
    console.log('📊 Cohort Members Table Columns:');
    result.forEach(row => console.log(`   • ${row.column_name}`));
    
    await sql.end();
  } catch (error) {
    console.error('❌ Migration failed:', error);
    await sql.end();
    process.exit(1);
  }
}

run();
