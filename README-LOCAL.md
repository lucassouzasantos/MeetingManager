
# 🏠 Execução Local do Sistema

Este guia explica como executar o sistema de agendamento de salas em um ambiente local fora do Replit.

## Pré-requisitos

- **Node.js 18+** instalado
- **npm** ou **yarn**
- **Git** (para clonar o repositório)
- **SQLite** (incluído) ou **PostgreSQL** (opcional)

## 🚀 Configuração Inicial

### 1. Clonar o Projeto
```bash
git clone [url-do-repositorio]
cd room-booking-system
```

### 2. Instalar Dependências
```bash
npm install
```

### 3. Configurar Banco de Dados

#### Opção A: SQLite (Recomendado para Desenvolvimento)
```bash
# Criar banco SQLite com dados iniciais
npm run setup:sqlite
```

#### Opção B: PostgreSQL Local
```sql
-- Criar banco PostgreSQL
CREATE DATABASE room_booking;
CREATE USER room_user WITH PASSWORD 'sua_senha';
GRANT ALL PRIVILEGES ON DATABASE room_booking TO room_user;
```

### 4. Configurar Variáveis de Ambiente

Criar arquivo `.env`:
```bash
# Para SQLite (recomendado)
DATABASE_URL=file:./database.sqlite

# Para PostgreSQL local
# DATABASE_URL=postgres://room_user:sua_senha@localhost:5432/room_booking

SESSION_SECRET=sua-chave-secreta-muito-longa-e-segura
PORT=5000
NODE_ENV=development
```

### 5. Inicializar Banco (se usando PostgreSQL)
```bash
npm run db:push
npm run db:seed
```

## 🎯 Executando o Sistema

### Modo Desenvolvimento
```bash
npm run dev
```

### Modo Produção Local
```bash
npm run build
npm start
```

## 🌐 Acessando o Sistema

- **Interface Web**: http://localhost:5000
- **API**: http://localhost:5000/api

### Credenciais de Teste

**Administradores:**
- `miriam` / `admin123`
- `lucas` / `admin123`

**Usuário comum:**
- `usuario` / `user123`

## 📁 Estrutura do Projeto Local

```
room-booking-system/
├── client/              # Frontend React
│   ├── src/
│   │   ├── components/  # Componentes UI
│   │   ├── hooks/       # Hooks customizados
│   │   ├── lib/         # Utilitários
│   │   └── pages/       # Páginas
│   └── index.html
├── server/              # Backend Express
│   ├── auth.ts          # Autenticação
│   ├── db.ts            # Configuração DB
│   ├── routes.ts        # Rotas API
│   └── storage.ts       # Acesso a dados
├── shared/              # Schemas compartilhados
├── scripts/             # Scripts utilitários
├── database.sqlite      # Banco SQLite (gerado)
└── package.json
```

## 🔧 Scripts Disponíveis

```bash
# Desenvolvimento
npm run dev              # Iniciar servidor dev
npm run build            # Build produção
npm start               # Servidor produção

# Banco de dados
npm run db:push         # Aplicar schema
npm run setup:sqlite    # Configurar SQLite

# Utilitários
npm run check          # Verificar tipos TypeScript
```

## ⚙️ Configurações Avançadas

### Banco de Dados
- **SQLite**: Arquivo `database.sqlite` na raiz
- **PostgreSQL**: Configure `DATABASE_URL` no `.env`

### Porta e Host
```bash
# .env
PORT=3000                    # Porta customizada
HOST=0.0.0.0                # Aceitar conexões externas
```

### Variáveis de Ambiente Completas
```bash
# .env
DATABASE_URL=file:./database.sqlite
SESSION_SECRET=chave-super-secreta-de-pelo-menos-32-caracteres
PORT=5000
NODE_ENV=development
VITE_API_URL=http://localhost:5000/api
```

## 🐛 Troubleshooting Local

### Problemas Comuns

**Erro "EADDRINUSE" (Porta em uso):**
```bash
# Encontrar processo usando a porta
lsof -ti:5000
# Matar processo
kill -9 [PID]
```

**Erro de permissões SQLite:**
```bash
# Dar permissões ao arquivo
chmod 666 database.sqlite
chmod 755 .
```

**Dependências não encontradas:**
```bash
# Limpar cache e reinstalar
rm -rf node_modules package-lock.json
npm install
```

**Erro de TypeScript:**
```bash
# Verificar tipos
npm run check
```

### Logs e Debug

```bash
# Logs detalhados
DEBUG=* npm run dev

# Verificar conexão do banco
node -e "
const db = require('./server/db.js');
console.log('DB connected:', !!db);
"
```

## 🚀 Deploy Local em Rede

Para acessar o sistema em outros dispositivos da rede:

```bash
# .env
HOST=0.0.0.0
PORT=5000

# Acessar via IP da máquina
# http://[SEU-IP]:5000
```

## 📊 Monitoramento Local

### PM2 (Produção Local)
```bash
# Instalar PM2
npm install -g pm2

# Iniciar com PM2
pm2 start npm --name "room-booking" -- start

# Monitorar
pm2 monit
```

### Logs de Aplicação
```bash
# Logs em tempo real
tail -f logs/application.log

# Logs de erro
tail -f logs/error.log
```

## 🔄 Backup Local

### SQLite
```bash
# Backup do banco
cp database.sqlite backup/database-$(date +%Y%m%d).sqlite

# Restaurar backup
cp backup/database-20240827.sqlite database.sqlite
```

### PostgreSQL
```bash
# Backup
pg_dump room_booking > backup/db-$(date +%Y%m%d).sql

# Restaurar
psql room_booking < backup/db-20240827.sql
```

---

**Para deployment em produção, consulte a documentação do seu provedor de hospedagem.**

## Comandos Úteis

- `npm run dev` - Inicia em modo desenvolvimento
- `npm run build` - Compila para produção
- `npm start` - Inicia em modo produção
- `npm run db:push` - Atualiza esquema do banco
- `npm run check` - Verifica tipos TypeScript

## Troubleshooting

### Erro de Conexão com Banco
- Verifique se o PostgreSQL está rodando
- Confirme as credenciais no `.env`
- Execute `npm run db:push` para criar tabelas

### Porta já em uso
- Mude a variável `PORT` no arquivo `.env`
- Ou termine o processo que está usando a porta

### Problemas de Autenticação
- Verifique se `SESSION_SECRET` está definido
- Limpe cookies do navegador se necessário
