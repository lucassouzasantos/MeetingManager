import { db, pool } from '../server/db.js';
import { migrate } from 'drizzle-orm/node-postgres/migrator';

async function runMigrations() {
  console.log('🚀 Executando migrações...');
  
  try {
    await migrate(db, { migrationsFolder: './migrations' });
    console.log('✅ Migrações executadas com sucesso!');
  } catch (error) {
    console.error('❌ Erro ao executar migrações:', error);
  } finally {
    await pool.end();
    process.exit(0);
  }
}

runMigrations();