import postgres from 'postgres';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const directUrl = process.env.DIRECT_URL || process.env.DATABASE_URL;

if (!directUrl) {
  console.error('❌ DATABASE_URL or DIRECT_URL environment variable not set');
  process.exit(1);
}

console.log('🔌 Connecting to Supabase (direct connection)...\n');

const sql = postgres(directUrl, {
  max: 1,
  ssl: 'require',
});

async function run() {
  try {
    console.log('📖 Reading migration 0005...');
    const migrationSQL = readFileSync(
      resolve(process.cwd(), 'migrations/0005_fix_rls_service_role_bypass.sql'), 
      'utf-8'
    );
    
    console.log('✅ Migration file loaded\n');
    console.log('🚀 Applying migration 0005_fix_rls_service_role_bypass...\n');
    
    await sql.unsafe(migrationSQL);
    
    console.log('✅ Migration 0005 completed successfully!\n');
    
    // Verify policies were created
    console.log('🔍 Verifying RLS policies...\n');
    
    const cohortPolicies = await sql`
      SELECT policyname, cmd 
      FROM pg_policies 
      WHERE tablename = 'cohorts' 
      ORDER BY policyname
    `;
    
    console.log('📊 Cohorts Table Policies:');
    cohortPolicies.forEach(row => console.log(`   • ${row.policyname} (${row.cmd})`));
    
    const memberPolicies = await sql`
      SELECT policyname, cmd 
      FROM pg_policies 
      WHERE tablename = 'cohort_members' 
      ORDER BY policyname
    `;
    
    console.log('\n📊 Cohort Members Table Policies:');
    memberPolicies.forEach(row => console.log(`   • ${row.policyname} (${row.cmd})`));
    
    await sql.end();
  } catch (error) {
    console.error('❌ Migration failed:', error);
    await sql.end();
    process.exit(1);
  }
}

run();
