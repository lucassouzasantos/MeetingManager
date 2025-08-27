import Database from 'better-sqlite3';
import { drizzle as drizzleSQLite } from 'drizzle-orm/better-sqlite3';
import { Pool } from 'pg';
import { drizzle as drizzlePostgres } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";

// Force SQLite for now since Supabase connection is not working
const databaseUrl = 'file:./database.sqlite';

console.log('🔧 Database URL configured');

let db: ReturnType<typeof drizzleSQLite> | ReturnType<typeof drizzlePostgres>;

// Use SQLite if DATABASE_URL starts with 'file:' or is not set
if (databaseUrl.startsWith('file:')) {
  console.log('🗃️  Using SQLite database');
  
  const sqlite = new Database('./database.sqlite');
  sqlite.pragma('journal_mode = WAL');
  
  db = drizzleSQLite(sqlite, { schema });
  
  console.log('✅ SQLite database initialized');
} else {
  console.log('🐘 Using PostgreSQL database');
  
  // Parse and fix Supabase URL if needed
  let connectionString = databaseUrl;

  // Check if it's a Supabase URL and fix common issues
  if (connectionString.includes('supabase.co')) {
    const url = new URL(connectionString);
    
    // If no port is specified, add default PostgreSQL port
    if (!url.port) {
      url.port = '5432';
    }
    
    // If no database is specified, use postgres
    if (url.pathname === '/' || url.pathname === '') {
      url.pathname = '/postgres';
    }
    
    connectionString = url.toString();
    console.log('🔗 Using Supabase connection with port:', url.port);
  }

  const pool = new Pool({ 
    connectionString,
    ssl: { rejectUnauthorized: false }, // Always use SSL for Supabase
    connectionTimeoutMillis: 10000, // 10 seconds
    idleTimeoutMillis: 30000, // 30 seconds
    max: 10, // Maximum number of clients in the pool
  });

  // Test connection on startup
  pool.on('connect', () => {
    console.log('✅ Connected to PostgreSQL database');
  });

  pool.on('error', (err) => {
    console.error('❌ PostgreSQL pool error:', err);
  });

  db = drizzlePostgres({ client: pool, schema });
}

export { db };