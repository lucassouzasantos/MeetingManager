
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

console.log('🚀 Iniciando servidor local...');

// Set environment variables for local development
process.env.NODE_ENV = 'development';
process.env.PORT = process.env.PORT || '6000';

// Start the server
const server = spawn('npm', ['run', 'dev'], {
  cwd: projectRoot,
  stdio: 'inherit',
  shell: true
});

server.on('close', (code) => {
  console.log(`Servidor encerrado com código ${code}`);
});

server.on('error', (error) => {
  console.error('Erro ao iniciar servidor:', error);
});

process.on('SIGINT', () => {
  console.log('\n🛑 Encerrando servidor...');
  server.kill();
  process.exit(0);
});
