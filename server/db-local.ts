
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "@shared/schema";

// Local PostgreSQL configuration
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgres://localhost:5432/room_booking',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

export const db = drizzle(pool, { schema });

// Test database connection
pool.on('connect', () => {
  console.log('🗄️  Conectado ao banco PostgreSQL local');
});

pool.on('error', (err) => {
  console.error('❌ Erro na conexão com banco:', err);
});
