import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

/**
 * Connection Pool Configuration (Codex §2.2.3)
 *
 * Explicit pool limits prevent connection exhaustion and ensure
 * proper resource cleanup in production environments.
 */
const poolConfig = {
  max: 20, // Maximum pool size (default: 10)
  idle_timeout: 30, // Close idle connections after 30s (default: unlimited)
  connect_timeout: 10, // Connection timeout 10s (default: 30s)
  max_lifetime: 60 * 30, // Close connections after 30 min (default: unlimited)
};

// Lazy singletons — only connect when first accessed at runtime.
// This prevents build-time crashes in CI where DATABASE_URL is not set.
let _db: ReturnType<typeof drizzle> | null = null;
let _migrationDb: ReturnType<typeof drizzle> | null = null;

function getConnectionString(): string {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error('DATABASE_URL environment variable is not set');
  }
  return url;
}

/** Database client for query operations (pooled connection) */
export const db = new Proxy({} as ReturnType<typeof drizzle>, {
  get(_target, prop, receiver) {
    if (!_db) {
      const queryClient = postgres(getConnectionString(), poolConfig);
      _db = drizzle(queryClient, { schema });
    }
    const value = Reflect.get(_db, prop, _db);
    if (typeof value === 'function') {
      return value.bind(_db);
    }
    return value;
  },
});

/** Database client for migrations (single direct connection) */
export const migrationDb = new Proxy({} as ReturnType<typeof drizzle>, {
  get(_target, prop, receiver) {
    if (!_migrationDb) {
      const directUrl = process.env.DIRECT_URL ?? getConnectionString();
      const migrationClient = postgres(directUrl, { max: 1 });
      _migrationDb = drizzle(migrationClient, { schema });
    }
    const value = Reflect.get(_migrationDb, prop, _migrationDb);
    if (typeof value === 'function') {
      return value.bind(_migrationDb);
    }
    return value;
  },
});
