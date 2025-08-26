import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Parse and fix Supabase URL if needed
let connectionString = process.env.DATABASE_URL;

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

export const pool = new Pool({ 
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

export const db = drizzle({ client: pool, schema });