
# 🏠 Instalação e Execução Local

## Pré-requisitos

- Node.js 18+ instalado
- PostgreSQL instalado e rodando
- npm ou yarn

## Configuração Inicial

### 1. Instalar Dependências
```bash
npm install
```

### 2. Configurar Banco de Dados PostgreSQL

Crie um banco de dados PostgreSQL:
```sql
CREATE DATABASE room_booking;
CREATE USER room_user WITH PASSWORD 'sua_senha';
GRANT ALL PRIVILEGES ON DATABASE room_booking TO room_user;
```

### 3. Configurar Variáveis de Ambiente

Copie o arquivo `.env.local` e ajuste conforme necessário:
```bash
cp .env.local .env
```

Edite o arquivo `.env` com suas configurações:
```
DATABASE_URL=postgres://room_user:sua_senha@localhost:5432/room_booking
SESSION_SECRET=sua-chave-secreta-muito-longa-e-segura
PORT=3000
NODE_ENV=development
```

### 4. Executar Migrações do Banco

```bash
npm run db:push
```

## Executando o Sistema

### Modo Desenvolvimento
```bash
npm run dev
```

### Modo Produção Local
```bash
npm run build
npm start
```

## Acessando o Sistema

- **Interface Web**: http://localhost:3000
- **API**: http://localhost:3000/api
- **Documentação**: Veja o arquivo `replit.md` para detalhes da API

## Estrutura do Projeto

```
├── client/          # Frontend React
├── server/          # Backend Express
├── shared/          # Tipos compartilhados
├── scripts/         # Scripts de utilitários
└── README-LOCAL.md  # Este arquivo
```

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
