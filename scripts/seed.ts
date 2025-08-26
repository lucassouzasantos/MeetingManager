import { db } from '../server/db.js';
import { users, rooms } from '../shared/schema.js';
import { hashPassword } from '../server/auth.js';

async function seed() {
  console.log('🌱 Iniciando seed do banco de dados...');

  try {
    // Criar usuários iniciais
    console.log('👥 Criando usuários...');
    
    const adminPassword = await hashPassword('admin123');
    const userPassword = await hashPassword('user123');

    await db.insert(users).values([
      {
        username: 'miriam',
        fullName: 'Miriam Zocche',
        email: 'miriam@pindo.com.py',
        position: 'Gerente de Projetos',
        password: adminPassword,
        isAdmin: true,
      },
      {
        username: 'lucas',
        fullName: 'Lucas Souza',
        email: 'lucas@pindo.com.py',
        position: 'Coordenador de TI',
        password: adminPassword,
        isAdmin: true,
      },
      {
        username: 'joao',
        fullName: 'João Silva',
        email: 'joao@pindo.com.py',
        position: 'Analista',
        password: userPassword,
        isAdmin: false,
      },
      {
        username: 'maria',
        fullName: 'Maria Santos',
        email: 'maria@pindo.com.py',
        position: 'Coordenadora',
        password: userPassword,
        isAdmin: false,
      },
      {
        username: 'pedro',
        fullName: 'Pedro Costa',
        email: 'pedro@pindo.com.py',
        position: 'Desenvolvedor',
        password: userPassword,
        isAdmin: false,
      }
    ]).onConflictDoNothing();

    console.log('🏢 Criando salas...');
    
    await db.insert(rooms).values([
      {
        name: 'Sala Executive Premium',
        location: '3º Andar - Ala Oeste',
        capacity: 12,
        isActive: true,
      },
      {
        name: 'Sala de Reuniões Alpha',
        location: '2º Andar - Centro',
        capacity: 8,
        isActive: true,
      },
      {
        name: 'Sala de Videoconferência',
        location: '4º Andar - Ala Norte',
        capacity: 15,
        isActive: true,
      },
      {
        name: 'Sala de Brainstorm',
        location: '1º Andar - Ala Sul',
        capacity: 6,
        isActive: true,
      },
      {
        name: 'Auditório Principal',
        location: 'Térreo - Centro',
        capacity: 50,
        isActive: true,
      }
    ]).onConflictDoNothing();

    console.log('✅ Seed concluído com sucesso!');
    console.log('');
    console.log('👤 Usuários criados:');
    console.log('  Admin: miriam@pindo.com.py / senha: admin123');
    console.log('  Admin: lucas@pindo.com.py / senha: admin123');
    console.log('  User:  joao@pindo.com.py / senha: user123');
    console.log('  User:  maria@pindo.com.py / senha: user123');
    console.log('  User:  pedro@pindo.com.py / senha: user123');
    console.log('');
    console.log('🏢 5 salas criadas');

  } catch (error) {
    console.error('❌ Erro durante o seed:', error);
  } finally {
    process.exit(0);
  }
}

seed();