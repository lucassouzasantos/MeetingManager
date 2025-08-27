#!/usr/bin/env tsx

import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { hashPassword } from '../server/auth';
import { nanoid } from 'nanoid';

console.log('🗃️  Configurando banco SQLite simples...');

// Initialize SQLite database
const sqlite = new Database('./database.sqlite');
sqlite.pragma('journal_mode = WAL');

// Create tables using SQL directly for SQLite (without UUIDs)
const createTables = () => {
  console.log('🔨 Criando tabelas...');
  
  // Users table
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
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
      id TEXT PRIMARY KEY,
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
      id TEXT PRIMARY KEY,
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
  
  try {
    // Create admin users
    console.log('👥 Criando usuários administradores...');
    
    const admin1Password = await hashPassword('admin123');
    const admin2Password = await hashPassword('admin123');
    const userPassword = await hashPassword('user123');
    
    // Insert users manually
    sqlite.prepare(`
      INSERT OR IGNORE INTO users (id, username, full_name, email, position, password, is_admin)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(nanoid(), 'miriam', 'Miriam Zocche', 'mzocche@pindo.com.py', 'Gerente', admin1Password, 1);
    
    sqlite.prepare(`
      INSERT OR IGNORE INTO users (id, username, full_name, email, position, password, is_admin)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(nanoid(), 'lucas', 'Lucas Souza', 'lucassouza@pindo.com.py', 'Coordenador', admin2Password, 1);
    
    sqlite.prepare(`
      INSERT OR IGNORE INTO users (id, username, full_name, email, position, password, is_admin)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(nanoid(), 'usuario', 'Usuário Teste', 'usuario@empresa.com', 'Funcionário', userPassword, 0);

    console.log('🏢 Criando salas...');
    
    sqlite.prepare(`
      INSERT OR IGNORE INTO rooms (id, name, location, capacity, is_active)
      VALUES (?, ?, ?, ?, ?)
    `).run(nanoid(), 'Sala de Reunião Principal', 'Andar 2 - Sala 201', 12, 1);
    
    sqlite.prepare(`
      INSERT OR IGNORE INTO rooms (id, name, location, capacity, is_active)
      VALUES (?, ?, ?, ?, ?)
    `).run(nanoid(), 'Sala de Videoconferência', 'Andar 3 - Sala 301', 8, 1);
    
    sqlite.prepare(`
      INSERT OR IGNORE INTO rooms (id, name, location, capacity, is_active)
      VALUES (?, ?, ?, ?, ?)
    `).run(nanoid(), 'Auditório', 'Andar Térreo', 50, 1);
    
    sqlite.prepare(`
      INSERT OR IGNORE INTO rooms (id, name, location, capacity, is_active)
      VALUES (?, ?, ?, ?, ?)
    `).run(nanoid(), 'Sala de Brainstorm', 'Andar 2 - Sala 205', 6, 1);

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
    sqlite.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro durante o setup:', error);
    sqlite.close();
    process.exit(1);
  }
};

setup();