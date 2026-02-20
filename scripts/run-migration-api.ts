import { readFileSync } from 'fs';
import { resolve } from 'path';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error(
    'Missing required env vars: NEXT_PUBLIC_SUPABASE_URL and/or SUPABASE_SERVICE_ROLE_KEY'
  );
}

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
    let statementIndex = 0;
    for (const stmt of statements) {
      statementIndex++;

      // Skip comments
      if (stmt.startsWith('--') || stmt.length < 10) continue;

      console.log(`Executing statement ${statementIndex}/${statements.length}...`);

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
