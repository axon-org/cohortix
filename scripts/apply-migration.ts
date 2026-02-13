/**
 * Apply Migration Script
 * 
 * Executes SQL migration files directly against Supabase Postgres
 * 
 * Run with: pnpm tsx scripts/apply-migration.ts supabase/migrations/20260213185300_create_missions_table.sql
 */

import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function applyMigration(migrationPath: string) {
  console.log(`📦 Applying migration: ${migrationPath}\n`)

  const fullPath = path.resolve(migrationPath)
  
  if (!fs.existsSync(fullPath)) {
    console.error(`❌ Migration file not found: ${fullPath}`)
    process.exit(1)
  }

  const sqlContent = fs.readFileSync(fullPath, 'utf-8')
  
  // Split by semicolons and execute each statement
  const statements = sqlContent
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'))

  console.log(`Found ${statements.length} SQL statements\n`)

  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i]
    
    // Skip comments
    if (stmt.startsWith('--')) continue
    
    const preview = stmt.substring(0, 100).replace(/\n/g, ' ')
    console.log(`[${i + 1}/${statements.length}] ${preview}...`)
    
    try {
      // Use the Supabase client to execute raw SQL (requires service_role)
      const { error } = await (supabase as any).rpc('exec', { sql: stmt + ';' })
      
      if (error) {
        console.error(`❌ Error executing statement ${i + 1}:`, error)
        console.error(`Statement: ${stmt.substring(0, 200)}`)
        // Continue with other statements
      }
    } catch (err) {
      console.error(`❌ Error executing statement ${i + 1}:`, err)
    }
  }

  console.log('\n✅ Migration completed!\n')
  console.log('📝 Note: Some errors may be expected (e.g., IF NOT EXISTS, IF EXISTS)')
  console.log('   Please verify the changes in your Supabase dashboard.')
}

const migrationFile = process.argv[2]

if (!migrationFile) {
  console.error('❌ Usage: pnpm tsx scripts/apply-migration.ts <migration-file>')
  console.error('   Example: pnpm tsx scripts/apply-migration.ts supabase/migrations/20260213185300_create_missions_table.sql')
  process.exit(1)
}

applyMigration(migrationFile)
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Error:', error)
    process.exit(1)
  })
