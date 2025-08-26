import { pool } from '../server/db.js';

async function testConnection() {
  console.log('🔗 Testando conexão com o banco de dados...');
  console.log('DATABASE_URL configurada:', process.env.DATABASE_URL ? 'Sim ✓' : 'Não ✗');
  
  if (process.env.DATABASE_URL) {
    const url = new URL(process.env.DATABASE_URL);
    console.log('Host:', url.hostname);
    console.log('Porta:', url.port);
    console.log('Banco:', url.pathname);
  }

  try {
    const client = await pool.connect();
    console.log('✅ Conexão com o banco de dados bem-sucedida!');
    
    const result = await client.query('SELECT NOW() as current_time');
    console.log('⏰ Hora do servidor:', result.rows[0].current_time);
    
    client.release();
  } catch (error) {
    console.error('❌ Erro na conexão:', error);
  } finally {
    await pool.end();
    process.exit(0);
  }
}

testConnection();