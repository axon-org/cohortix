import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

// Database connection for migrations and server-side operations
const connectionString = process.env.DATABASE_URL!;

if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is not set');
}

/**
 * Connection Pool Configuration (Codex §2.2.3)
 * 
 * Explicit pool limits prevent connection exhaustion and ensure
 * proper resource cleanup in production environments.
 */
const poolConfig = {
  max: 20,                    // Maximum pool size (default: 10)
  idle_timeout: 30,           // Close idle connections after 30s (default: unlimited)
  connect_timeout: 10,        // Connection timeout 10s (default: 30s)
  max_lifetime: 60 * 30,      // Close connections after 30 min (default: unlimited)
}

// For query purposes
const queryClient = postgres(connectionString, poolConfig);
export const db = drizzle(queryClient, { schema });

// For migrations (single connection to avoid conflicts)
const migrationClient = postgres(connectionString, { max: 1 });
export const migrationDb = drizzle(migrationClient, { schema });
