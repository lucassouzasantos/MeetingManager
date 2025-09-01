import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from "@shared/schema";

console.log('🔧 Database URL configured');

// Always use SQLite
const sqlite = new Database('./database.sqlite');
sqlite.pragma('journal_mode = WAL');

export const db = drizzle(sqlite, { schema });

console.log('🗃️  Using SQLite database');
console.log('✅ SQLite database initialized');