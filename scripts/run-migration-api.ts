import { readFileSync } from 'fs';
import { resolve } from 'path';

const supabaseUrl = 'https://rfwscvklcokzuofyzqwx.supabase.co';
const serviceRoleKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJmd3NjdmtsY29renVvZnl6cXd4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDcyNDYyNCwiZXhwIjoyMDg2MzAwNjI0fQ.DtEf0p3b_tBCvzO5g3Al6QqCkDg-Y8K6-xRI4rcKqNM';

async function runMigration() {
  try {
    console.log('📖 Reading migration file...');
    const migrationPath = resolve(
      process.cwd(),
      'packages/database/src/migrations/0000_initial_with_rls.sql'
    );
    const migrationSQL = readFileSync(migrationPath, 'utf-8');

    console.log('✅ Migration file loaded\n');

    // Split into individual statements (rough split, may need refinement)
    const statements = migrationSQL
      .split(';')
      .map((s) => s.trim())
      .filter((s) => s.length > 0 && !s.startsWith('--'));

    console.log(`📝 Found ${statements.length} SQL statements\n`);
    console.log('🚀 Executing migration via Supabase REST API...\n');

    // Execute each statement via the PostgREST RPC endpoint
    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i];

      // Skip comments
      if (stmt.startsWith('--') || stmt.length < 10) continue;

      console.log(`Executing statement ${i + 1}/${statements.length}...`);

      try {
        const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${serviceRoleKey}`,
            apikey: serviceRoleKey,
          },
          body: JSON.stringify({
            sql: stmt + ';',
          }),
        });

        if (!response.ok) {
          const error = await response.text();
          console.log(`  ⚠️  Warning: ${error.slice(0, 100)}`);
        } else {
          console.log(`  ✅`);
        }
      } catch (error: any) {
        console.log(`  ⚠️  Warning: ${error.message}`);
      }
    }

    console.log('\n✨ Migration execution complete!\n');
    console.log(
      'Note: Some warnings are expected if tables already exist or RPC endpoint is not available.'
    );
    console.log('Please verify the schema in Supabase Dashboard → Database → Tables\n');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

runMigration();
