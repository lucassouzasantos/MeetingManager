# Sistema de Agendamento de Salas - Configuração com Supabase

Este guia explica como configurar o sistema para usar Supabase como banco de dados e rodá-lo localmente.

## Pré-requisitos

- Node.js 18+ instalado
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

1. No painel do Supabase, vá para **Settings** > **Database**
2. Na seção "Connection string", copie a URI sob **Connection pooling**
3. Substitua `[YOUR-PASSWORD]` pela senha que você criou
4. A URL deve ter o formato:
   ```
   postgresql://postgres.your-project-ref:your-password@aws-0-sa-east-1.pooler.supabase.com:6543/postgres
   ```

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

### 5. Seed do Banco (Dados Iniciais)

Execute o seed para criar usuários iniciais:

```bash
npm run db:seed
```

Isso criará usuários de exemplo:
- **Admin**: miriam@pindo.com.py / senha: admin123
- **Admin**: lucas@pindo.com.py / senha: admin123
- **Usuário**: joao@pindo.com.py / senha: user123

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

### Erro de Conexão com o Banco
- Verifique se a DATABASE_URL está correta
- Confirme que a senha está correta na URL
- Verifique se o projeto Supabase está ativo

### Tabelas não existem
- Execute `npm run db:migrate` para criar as tabelas

### Não consegue fazer login
- Execute `npm run db:seed` para criar usuários iniciais
- Verifique se as migrações foram executadas

## Suporte

Para problemas ou dúvidas, verifique:
1. Se todas as dependências foram instaladas (`npm install`)
2. Se a DATABASE_URL está configurada corretamente
3. Se as migrações foram executadas (`npm run db:migrate`)
4. Se o seed foi executado (`npm run db:seed`)