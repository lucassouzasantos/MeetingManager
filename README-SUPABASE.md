# 🐘 Configuração com PostgreSQL/Supabase

Este guia explica como configurar o sistema para usar PostgreSQL via Supabase em vez do SQLite padrão. Use esta configuração para ambientes de produção ou quando precisar de recursos avançados do PostgreSQL.

## ⚠️ Nota Importante

**O sistema está configurado para usar SQLite por padrão**, que é mais simples e não requer configuração externa. Use PostgreSQL/Supabase apenas se:

- Precisar de recursos avançados do PostgreSQL
- Estiver em produção
- Tiver múltiplos usuários simultâneos
- Quiser compartilhar dados entre instâncias

## Pré-requisitos

- Sistema funcionando com SQLite (configuração padrão)
- Conta no Supabase (gratuita)

## Configuração do Supabase

### 1. Criar Projeto no Supabase

1. Acesse [https://supabase.com](https://supabase.com)
2. Faça login ou crie uma conta
3. Clique em "New Project"
4. Escolha sua organização
5. Preencha:
   - **Name**: Room Booking System (ou nome de sua escolha)
   - **Database Password**: Crie uma senha forte e anote
   - **Region**: Escolha a região mais próxima
6. Clique em "Create new project"

### 2. Obter URL de Conexão

**IMPORTANTE**: Use a conexão direta, não a pooling, pois o Replit pode ter problemas com connection pooling.

1. No painel do Supabase, vá para **Settings** > **Database**
2. Na seção "Connection string", copie a URI sob **Direct connection** (não use pooling)
3. Substitua `[YOUR-PASSWORD]` pela senha que você criou
4. A URL deve ter o formato:
   ```
   postgresql://postgres:your-password@db.your-project-ref.supabase.co:5432/postgres
   ```

**Exemplo correto**:
```
postgresql://postgres:mypassword123@db.abcdefghijk.supabase.co:5432/postgres
```

**ATENÇÃO**: 
- Use **Direct connection**, NÃO connection pooling
- Certifique-se de que a porta seja **5432**
- O banco deve ser **postgres** no final da URL

### 3. Configurar Variáveis de Ambiente

Você precisará adicionar a URL do banco de dados como uma variável de ambiente secreta no Replit:

1. No Replit, vá para a aba "Secrets" (ícone de chave no painel lateral)
2. Adicione uma nova secret:
   - **Key**: `DATABASE_URL`
   - **Value**: A URL de conexão que você copiou do Supabase

### 4. Executar Migrações

Após configurar a DATABASE_URL, execute as migrações para criar as tabelas:

```bash
npm run db:migrate
```

### 5. Configurar o Sistema para PostgreSQL

Altere a configuração do sistema para usar PostgreSQL em vez de SQLite:

```bash
# Edite server/db.ts e altere a linha:
# const databaseUrl = 'file:./database.sqlite';
# para:
# const databaseUrl = process.env.DATABASE_URL || 'file:./database.sqlite';
```

### 6. Criar Tabelas Manualmente

Como o sistema está otimizado para SQLite, você precisará criar as tabelas manualmente no Supabase:

1. Vá para **SQL Editor** no painel do Supabase
2. Execute este script SQL:

## Rodando Localmente

### 1. Instalar Dependências

```bash
npm install
```

### 2. Configurar Variáveis de Ambiente

Se estiver rodando localmente (não no Replit), crie um arquivo `.env` na raiz do projeto:

```env
SESSION_SECRET=your-super-secret-session-key-for-authentication-should-be-at-least-32-characters-long
DATABASE_URL=postgresql://postgres.your-project-ref:your-password@aws-0-sa-east-1.pooler.supabase.com:6543/postgres
```

### 3. Executar Migrações

```bash
npm run db:migrate
```

### 4. Executar Seed (Opcional)

```bash
npm run db:seed
```

### 5. Iniciar o Servidor

```bash
npm run dev
```

O sistema estará disponível em `http://localhost:5000`

## Scripts Disponíveis

- `npm run dev` - Inicia o servidor de desenvolvimento
- `npm run build` - Compila o projeto para produção
- `npm run db:generate` - Gera migrações baseadas no schema
- `npm run db:migrate` - Executa migrações pendentes
- `npm run db:seed` - Insere dados iniciais

## Estrutura do Banco

O sistema criará automaticamente as seguintes tabelas:

- **users** - Usuários do sistema
- **rooms** - Salas de reunião
- **bookings** - Agendamentos

## Funcionalidades

- ✅ Autenticação de usuários
- ✅ Gestão de salas (admin)
- ✅ Agendamento de reuniões
- ✅ Dashboard administrativo
- ✅ Gestão de usuários (admin)
- ✅ Trocar senha de usuários (admin)
- ✅ Verificação de conflitos de horário
- ✅ Interface responsiva

## Problemas Comuns

### ❌ Timeout de Conexão (ETIMEDOUT)
**Problema**: `connect ETIMEDOUT` ou `Connection terminated due to connection timeout`

**Soluções**:
1. **Verifique a URL**: Use **Direct connection**, não connection pooling
2. **Formato correto**: `postgresql://postgres:password@db.ref.supabase.co:5432/postgres`
3. **Teste no Supabase**: No painel do Supabase, vá em SQL Editor e execute `SELECT NOW();` para testar se o banco está funcionando
4. **IP do Replit**: Alguns projetos Supabase limitam conexões por IP. Desabilite isso em Settings > Database > Network Restrictions

### ❌ Erro de Autenticação
- Confirme que a senha na URL está correta (sem caracteres especiais codificados)
- Teste fazer login direto no painel do Supabase com a mesma senha

### ❌ Tabelas não existem
**Solução**: Execute as migrações pelo Supabase SQL Editor:

1. Vá para SQL Editor no painel do Supabase
2. Cole e execute este SQL:

```sql
-- Criar tabela de usuários
CREATE TABLE IF NOT EXISTS users (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    username varchar(255) UNIQUE NOT NULL,
    full_name varchar(255) NOT NULL,
    email varchar(255) UNIQUE NOT NULL,
    position varchar(255),
    password varchar(255) NOT NULL,
    is_admin boolean DEFAULT false,
    created_at timestamp DEFAULT now()
);

-- Criar tabela de salas
CREATE TABLE IF NOT EXISTS rooms (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    name varchar(255) NOT NULL,
    location varchar(255) NOT NULL,
    capacity integer NOT NULL,
    is_active boolean DEFAULT true,
    created_at timestamp DEFAULT now()
);

-- Criar tabela de agendamentos
CREATE TABLE IF NOT EXISTS bookings (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    title varchar(255) NOT NULL,
    description text,
    date varchar(10) NOT NULL,
    start_time varchar(5) NOT NULL,
    end_time varchar(5) NOT NULL,
    status varchar(20) DEFAULT 'confirmed',
    user_id uuid REFERENCES users(id) ON DELETE CASCADE,
    room_id uuid REFERENCES rooms(id) ON DELETE CASCADE,
    created_at timestamp DEFAULT now()
);
```

### ✅ Voltar para SQLite (Recomendado)
Se houver problemas com Supabase, volte para SQLite:

1. Remova ou comente a DATABASE_URL nos Secrets do Replit
2. O sistema voltará automaticamente para SQLite
3. Execute: `tsx scripts/simple-seed.ts` para recriar os dados

### ❌ Erro de SSL
Se houver problemas com SSL, adicione `?sslmode=require` no final da URL

## Suporte

Para problemas ou dúvidas, verifique:
1. Se todas as dependências foram instaladas (`npm install`)
2. Se a DATABASE_URL está configurada corretamente
3. Se as migrações foram executadas (`npm run db:migrate`)
4. Se o seed foi executado (`npm run db:seed`)