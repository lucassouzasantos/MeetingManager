#!/usr/bin/env tsx

import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from '../shared/schema';
import { hashPassword } from '../server/auth';

console.log('🗃️  Configurando banco SQLite...');

// Initialize SQLite database
const sqlite = new Database('./database.sqlite');
sqlite.pragma('journal_mode = WAL');

// Create tables using SQL directly for SQLite
const createTables = () => {
  console.log('🔨 Criando tabelas...');
  
  // Users table
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      username TEXT UNIQUE NOT NULL,
      full_name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      position TEXT,
      password TEXT NOT NULL,
      is_admin INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Rooms table
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS rooms (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      name TEXT NOT NULL,
      location TEXT NOT NULL,
      capacity INTEGER NOT NULL,
      is_active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Bookings table
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS bookings (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      title TEXT NOT NULL,
      description TEXT,
      date TEXT NOT NULL,
      start_time TEXT NOT NULL,
      end_time TEXT NOT NULL,
      status TEXT DEFAULT 'confirmed',
      user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
      room_id TEXT REFERENCES rooms(id) ON DELETE CASCADE,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);
  
  console.log('✅ Tabelas criadas');
};

const seedData = async () => {
  console.log('🌱 Inserindo dados iniciais...');
  
  const db = drizzle(sqlite, { schema });
  
  try {
    // Create admin users
    console.log('👥 Criando usuários administradores...');
    
    const admin1Password = await hashPassword('admin123');
    const admin2Password = await hashPassword('admin123');
    
    await db.insert(schema.users).values([
      {
        username: 'miriam',
        full_name: 'Miriam Zocche',
        email: 'mzocche@pindo.com.py',
        position: 'Gerente',
        password: admin1Password,
        is_admin: true,
      },
      {
        username: 'lucas',
        full_name: 'Lucas Souza',
        email: 'lucassouza@pindo.com.py',
        position: 'Coordenador',
        password: admin2Password,
        is_admin: true,
      }
    ]).onConflictDoNothing();

    // Create regular user
    const userPassword = await hashPassword('user123');
    
    await db.insert(schema.users).values({
      username: 'usuario',
      full_name: 'Usuário Teste',
      email: 'usuario@empresa.com',
      position: 'Funcionário',
      password: userPassword,
      is_admin: false,
    }).onConflictDoNothing();

    console.log('🏢 Criando salas...');
    
    await db.insert(schema.rooms).values([
      {
        name: 'Sala de Reunião Principal',
        location: 'Andar 2 - Sala 201',
        capacity: 12,
        is_active: true,
      },
      {
        name: 'Sala de Videoconferência',
        location: 'Andar 3 - Sala 301',
        capacity: 8,
        is_active: true,
      },
      {
        name: 'Auditório',
        location: 'Andar Térreo',
        capacity: 50,
        is_active: true,
      },
      {
        name: 'Sala de Brainstorm',
        location: 'Andar 2 - Sala 205',
        capacity: 6,
        is_active: true,
      }
    ]).onConflictDoNothing();

    console.log('✅ Dados inseridos com sucesso!');
    console.log('');
    console.log('👤 Usuários criados:');
    console.log('   Admin: miriam / admin123 (mzocche@pindo.com.py)');
    console.log('   Admin: lucas / admin123 (lucassouza@pindo.com.py)');
    console.log('   User:  usuario / user123 (usuario@empresa.com)');
    console.log('');
    console.log('🏢 4 salas de reunião criadas');

  } catch (error) {
    console.error('❌ Erro ao inserir dados:', error);
    throw error;
  }
};

const setup = async () => {
  try {
    createTables();
    await seedData();
    console.log('🎉 Setup do SQLite concluído!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro durante o setup:', error);
    process.exit(1);
  }
};

setup();