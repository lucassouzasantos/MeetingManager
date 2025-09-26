
#!/usr/bin/env node

import fs from 'fs';
import { execSync } from 'child_process';
import readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('🏠 Configuração do Sistema para Servidor Local\n');

const question = (prompt) => new Promise((resolve) => {
  rl.question(prompt, resolve);
});

async function setup() {
  try {
    console.log('1️⃣ Verificando dependências...');
    
    // Check if .env exists
    if (!fs.existsSync('.env')) {
      console.log('📝 Criando arquivo .env...');
      
      const dbUrl = await question('URL do banco PostgreSQL (ex: postgres://user:pass@localhost:5432/room_booking): ');
      const port = await question('Porta do servidor (padrão 6000): ') || '6000';
      const sessionSecret = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      
      const envContent = `# Configuração Local
DATABASE_URL=${dbUrl}
SESSION_SECRET=${sessionSecret}
PORT=${port}
NODE_ENV=development
`;
      
      fs.writeFileSync('.env', envContent);
      console.log('✅ Arquivo .env criado');
    }
    
    console.log('2️⃣ Instalando dependências...');
    execSync('npm install', { stdio: 'inherit' });
    
    console.log('3️⃣ Configurando banco de dados...');
    try {
      execSync('npm run db:push', { stdio: 'inherit' });
      console.log('✅ Banco de dados configurado');
    } catch (error) {
      console.log('⚠️  Erro ao configurar banco. Execute manualmente: npm run db:push');
    }
    
    console.log('\n🎉 Setup concluído!');
    console.log('\nPara iniciar o servidor:');
    console.log('  npm run dev');
    console.log(`\nAcesse: http://localhost:${process.env.PORT || 3000}`);
    
  } catch (error) {
    console.error('❌ Erro durante setup:', error.message);
  } finally {
    rl.close();
  }
}

setup();
