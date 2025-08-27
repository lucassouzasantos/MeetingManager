import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from "@shared/schema";
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';

// Create SQLite database
const sqlite = new Database('./database.sqlite');
sqlite.pragma('journal_mode = WAL');

export const db = drizzle(sqlite, { schema });

// Run migrations automatically
try {
  migrate(db, { migrationsFolder: './migrations' });
  console.log('✅ SQLite migrations completed');
} catch (error) {
  console.log('ℹ️  No migrations to run or already completed');
}

export { sqlite };