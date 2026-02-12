import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load environment variables
dotenv.config({ path: resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function enableExtensions() {
  console.log('🔌 Enabling database extensions...\n');

  const extensions = [
    { name: 'uuid-ossp', description: 'UUID generation' },
    { name: 'pgcrypto', description: 'Cryptographic functions' },
    { name: 'vector', description: 'pgvector for embeddings' },
    { name: 'pg_trgm', description: 'Full-text search' },
  ];

  for (const ext of extensions) {
    console.log(`Enabling ${ext.name} (${ext.description})...`);
    
    const { error } = await supabase.rpc('exec_sql', {
      sql: `CREATE EXTENSION IF NOT EXISTS "${ext.name}";`,
    });

    if (error) {
      // If rpc doesn't exist, try direct SQL
      const { error: directError } = await supabase
        .from('_metadata')
        .select('*')
        .limit(1);
      
      if (directError) {
        console.log(`⚠️  Cannot use RPC, trying alternative method...`);
        // Extensions might already be enabled or need manual setup
        console.log(`   Run this SQL in Supabase SQL Editor:`);
        console.log(`   CREATE EXTENSION IF NOT EXISTS "${ext.name}";`);
      }
    } else {
      console.log(`✅ ${ext.name} enabled`);
    }
  }

  console.log('\n✨ Extension setup complete!');
  console.log('\nIf you see errors above, manually run these in Supabase SQL Editor:');
  console.log('---');
  extensions.forEach(ext => {
    console.log(`CREATE EXTENSION IF NOT EXISTS "${ext.name}";`);
  });
  console.log('---\n');
}

enableExtensions().catch(console.error);
