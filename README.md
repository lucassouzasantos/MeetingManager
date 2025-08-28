# Sistema de Agendamento de Salas de Reunião

Um sistema completo de gerenciamento de reservas de salas, desenvolvido em TypeScript com React, Express.js e SQLite/PostgreSQL.

## 🚀 Funcionalidades

### 👤 Para Usuários
- **Autenticação segura** com login por usuário/email e senha
- **Visualização de salas** disponíveis com informações detalhadas
- **Criar agendamentos** com verificação automática de conflitos
- **Gerenciar reservas** pessoais (visualizar, cancelar)
- **Interface responsiva** com suporte a tema claro/escuro

### 👨‍💼 Para Administradores
- **Dashboard administrativo** com estatísticas em tempo real
- **Gerenciar salas** (criar, editar, desativar)
- **Gerenciar usuários** (visualizar, promover/despromover admin, alterar senhas)
- **Visualizar todos os agendamentos** do sistema
- **Estatísticas de ocupação** e uso das salas

## 🛠️ Tecnologias

### Frontend
- **React 18** com TypeScript
- **Tailwind CSS** + **shadcn/ui** para interface moderna
- **TanStack Query** para gerenciamento de estado do servidor
- **React Hook Form** + **Zod** para formulários tipados
- **Wouter** para roteamento leve

### Backend
- **Express.js** com TypeScript
- **Drizzle ORM** para operações de banco tipadas
- **Passport.js** para autenticação
- **Express Session** para gerenciamento de sessões
- **Zod** para validação de dados

### Banco de Dados
- **SQLite** (padrão) ou **PostgreSQL/Supabase**
- **Drizzle Kit** para migrações
- **Tipagem completa** com schemas compartilhados

## 🏁 Início Rápido

### 1. Configuração Inicial

```bash
# Clonar repositório (se aplicável)
git clone [url-do-repositorio]

# As dependências já estão instaladas no Replit
# Para instalação local: npm install
```

### 2. Executar o Sistema

```bash
# Iniciar servidor de desenvolvimento
npm run dev
```

O sistema estará disponível em `http://localhost:5000`

### 3. Dados Iniciais

O sistema já vem com dados de exemplo:

**Administradores:**
- `miriam` / `admin123` (mzocche@pindo.com.py)
- `lucas` / `admin123` (lucassouza@pindo.com.py)

**Usuário comum:**
- `usuario` / `user123` (usuario@empresa.com)

**Salas disponíveis:**
- Sala de Reunião Principal (12 pessoas)
- Sala de Videoconferência (8 pessoas)
- Auditório (50 pessoas)
- Sala de Brainstorm (6 pessoas)

## 📋 Como Usar

### Para Usuários Comuns

1. **Login**: Use suas credenciais na tela inicial
2. **Navegar**: Use o menu lateral para acessar diferentes seções
3. **Agendar Sala**: 
   - Vá em "Novo Agendamento"
   - Escolha sala, data, horário e adicione detalhes
   - O sistema verificará automaticamente conflitos
4. **Gerenciar Reservas**: Veja seus agendamentos em "Meus Agendamentos"

### Para Administradores

1. **Dashboard**: Visualize estatísticas gerais do sistema
2. **Gerenciar Salas**: 
   - Criar novas salas
   - Editar informações (nome, localização, capacidade)
   - Desativar salas temporariamente
3. **Gerenciar Usuários**:
   - Ver todos os usuários cadastrados
   - Promover/despromover administradores
   - Alterar senhas de usuários
4. **Todos os Agendamentos**: Visualizar reservas de todos os usuários

## 🗄️ Banco de Dados

### SQLite (Configuração Atual)
- **Arquivo**: `database.sqlite` na raiz do projeto
- **Vantagens**: Simples, sem configuração externa
- **Ideal para**: Desenvolvimento, testes, pequenas equipes

### PostgreSQL/Supabase (Opcional)
- **Configuração**: Ver `README-SUPABASE.md`
- **Vantagens**: Mais robusto, recursos avançados
- **Ideal para**: Produção, grandes equipes

## 🔐 Segurança

- **Autenticação**: Sessões seguras com express-session
- **Senhas**: Hash com scrypt + salt
- **Autorização**: Controle de acesso baseado em roles
- **Validação**: Schemas Zod em frontend e backend
- **SQL Injection**: Proteção via Drizzle ORM

## 📁 Estrutura do Projeto

```
├── client/              # Frontend React
│   ├── src/
│   │   ├── components/  # Componentes UI
│   │   ├── hooks/       # Hooks customizados
│   │   ├── lib/         # Utilitários e configurações
│   │   └── pages/       # Páginas da aplicação
│   └── index.html
├── server/              # Backend Express
│   ├── auth.ts          # Configuração de autenticação
│   ├── db.ts            # Configuração do banco
│   ├── routes.ts        # Rotas da API
│   └── storage.ts       # Camada de acesso a dados
├── shared/              # Tipos e schemas compartilhados
│   └── schema.ts
├── scripts/             # Scripts de setup e utilitários
└── migrations/          # Migrações do banco
```

## 🚀 Deployment

### Replit (Recomendado)
- O sistema está configurado para rodar no Replit
- Use o botão "Deploy" para publicar
- SSL e domínio automáticos

### Outros Provedores
```bash
# Build para produção
npm run build

# Iniciar servidor
npm start
```

## 🔧 Scripts Disponíveis

```bash
npm run dev        # Desenvolvimento
npm run build      # Build para produção
npm start          # Servidor de produção
npm run check      # Verificação de tipos
npm run db:push    # Aplicar mudanças no schema
```

## 📚 Documentação Adicional

- **`README-SUPABASE.md`**: Configuração com PostgreSQL/Supabase
- **`README-LOCAL.md`**: Execução em ambiente local
- **`replit.md`**: Documentação técnica detalhada

## 🆘 Suporte e Troubleshooting

### Problemas Comuns

**Login não funciona:**
- Verificar credenciais
- Confirmar se o banco foi inicializado

**Erro ao agendar sala:**
- Verificar se a sala está ativa
- Confirmar se não há conflito de horário

**Interface não carrega:**
- Verificar se o servidor está rodando
- Confirmar se as dependências foram instaladas

### Logs e Debug
- Logs do servidor aparecem no console
- Erros do frontend aparecem no DevTools do navegador

## 👨‍💻 Desenvolvimento

### Tecnologias e Padrões
- **TypeScript strict** para tipagem completa
- **ESM modules** em todo o projeto
- **Schemas compartilhados** entre frontend/backend
- **Validação dupla** (client + server)
- **Componentes reutilizáveis** com shadcn/ui

### Contribuindo
1. Mantenha a tipagem rigorosa
2. Use os schemas compartilhados
3. Valide dados no frontend e backend
4. Teste em diferentes resoluções
5. Documente mudanças significativas no `replit.md`

---

**Sistema desenvolvido com foco em usabilidade, segurança e manutenibilidade.**