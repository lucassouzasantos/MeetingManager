# Room Booking Management System

## Overview

This is a full-stack room booking management system built with React, TypeScript, Express.js, and SQLite/PostgreSQL. The application provides a comprehensive solution for managing meeting rooms and their bookings within an organization. Users can view available rooms, create bookings, and administrators have additional privileges to manage rooms and users.

The system features a modern, responsive interface built with shadcn/ui components and Tailwind CSS, offering both light and dark theme support. The application implements secure authentication with session management and role-based access control.

**Current Status**: Sistema funcionando completamente com SQLite como banco de dados principal. PostgreSQL/Supabase disponível como opção alternativa via configuração manual.

**Last Updated**: August 28, 2024 - Sistema migrado para SQLite, corrigidos erros de compatibilidade, todas as funcionalidades operacionais.

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Changes

- **2024-08-28**: Migração completa para SQLite como banco padrão
- **2024-08-28**: Correção de erros de login e queries do React Query
- **2024-08-28**: Ajustes de compatibilidade SQLite (conversão booleanos para números)
- **2024-08-28**: Implementação de funcionalidade completa de alteração de senhas
- **2024-08-27**: Criação de scripts de setup automatizados para SQLite
- **2024-08-26**: Tentativa de migração para Supabase (problemas de conectividade)

## Current System Status

### ✅ Funcionando Completamente
- Sistema de login e autenticação
- Dashboard administrativo com estatísticas
- Gestão de salas (criar, editar, desativar)
- Gestão de usuários (promover admin, alterar senhas)
- Sistema de agendamentos com verificação de conflitos
- Interface responsiva com tema claro/escuro

### 🗄️ Banco de Dados Atual
- **Tipo**: SQLite (arquivo local `database.sqlite`)
- **Vantagens**: Simples, sem dependências externas, rápido
- **Status**: Totalmente funcional e otimizado

### 👥 Usuários de Teste
- **Admin**: miriam / admin123 (mzocche@pindo.com.py)
- **Admin**: lucas / admin123 (lucassouza@pindo.com.py)
- **User**: usuario / user123 (usuario@empresa.com)

### 🏢 Salas Disponíveis
- Sala de Reunião Principal (12 pessoas)
- Sala de Videoconferência (8 pessoas)
- Auditório (50 pessoas)
- Sala de Brainstorm (6 pessoas)

## System Architecture

### Frontend Architecture

The client-side application is built using **React 18** with **TypeScript** for type safety. The architecture follows modern React patterns:

- **Component Structure**: Uses shadcn/ui components built on top of Radix UI primitives for accessibility and consistency
- **State Management**: Leverages TanStack Query (React Query) for server state management, caching, and data synchronization
- **Routing**: Implements wouter for lightweight client-side routing with protected route patterns
- **Styling**: Utilizes Tailwind CSS with CSS custom properties for theming and responsive design
- **Form Handling**: Uses React Hook Form with Zod schema validation for type-safe form management
- **Authentication Context**: Provides global authentication state management through React Context

### Backend Architecture

The server-side is built with **Express.js** using a modular architecture:

- **Authentication Layer**: Implements Passport.js with local strategy for username/email and password authentication
- **Session Management**: Uses express-session with PostgreSQL store for persistent sessions
- **Password Security**: Employs Node.js crypto module with scrypt for secure password hashing
- **API Routes**: RESTful API design with role-based access control for admin functions
- **Database Layer**: Drizzle ORM provides type-safe database operations with schema validation
- **Error Handling**: Centralized error handling middleware with proper HTTP status codes

### Database Design

The application uses **SQLite** (default) or **PostgreSQL** with Drizzle ORM for database operations:

- **Users Table**: Stores user credentials, profile information, and admin status (integer for booleans in SQLite)
- **Rooms Table**: Contains room details including name, location, capacity, and active status
- **Bookings Table**: Manages booking records with foreign keys to users and rooms
- **Relationships**: Properly defined foreign key constraints and relations between entities
- **Schema Validation**: Zod schemas ensure data integrity at both API and database levels
- **SQLite Compatibility**: Boolean values stored as integers (0/1) for SQLite compatibility

### Authentication & Authorization

The system implements a robust authentication mechanism:

- **Session-based Authentication**: Secure session management with MemoryStore for SQLite
- **Role-based Access Control**: Differentiates between regular users and administrators
- **Password Security**: Uses scrypt hashing with salt for secure password storage
- **Login Flexibility**: Supports login with username or email address
- **Protected Routes**: Client-side route protection with authentication state checking
- **Dual Login Support**: Allows login with either username or email address

### Data Validation & Type Safety

The application maintains type safety throughout the stack:

- **Shared Schema**: Common TypeScript types and Zod schemas shared between client and server
- **Runtime Validation**: All API inputs validated using Zod schemas
- **Type Generation**: Drizzle ORM generates TypeScript types from database schema
- **Form Validation**: Client-side validation with React Hook Form and Zod resolvers

### Development Tooling

The project includes comprehensive development tools:

- **Build System**: Vite for fast development and optimized production builds
- **TypeScript Configuration**: Strict TypeScript settings with path mapping for clean imports
- **Database Migrations**: Drizzle Kit for schema migrations and database management
- **Code Organization**: Clear separation of concerns with shared utilities and components

## External Dependencies

### Core Technologies
- **better-sqlite3**: SQLite database driver for local development
- **pg**: PostgreSQL driver for production/Supabase (optional)
- **drizzle-orm**: Type-safe ORM for database operations and query building
- **@tanstack/react-query**: Server state management and data fetching library
- **passport**: Authentication middleware for Express.js applications
- **express-session**: Session management middleware with MemoryStore
- **memorystore**: Session store for development with SQLite

### UI & Styling
- **@radix-ui/***: Accessible, unstyled UI component primitives
- **tailwindcss**: Utility-first CSS framework for rapid UI development
- **class-variance-authority**: Utility for creating variant-based component APIs
- **lucide-react**: Icon library providing consistent iconography

### Form & Validation
- **react-hook-form**: Performant forms library with minimal re-renders
- **@hookform/resolvers**: Integration between React Hook Form and validation libraries
- **zod**: TypeScript-first schema validation library
- **drizzle-zod**: Integration between Drizzle ORM and Zod for schema validation

### Development Tools
- **vite**: Next-generation frontend build tool with fast HMR
- **tsx**: TypeScript execution environment for development server
- **esbuild**: Fast JavaScript bundler for production builds
- **drizzle-kit**: Database schema management and migration tool

### Additional Libraries
- **date-fns**: Modern JavaScript date utility library
- **wouter**: Lightweight routing library for React applications
- **cmdk**: Command palette component for enhanced user experience
- **embla-carousel-react**: Carousel component for interactive content display

## Available Scripts

### Development
- **`npm run dev`**: Start development server with hot reload
- **`npm run build`**: Build for production
- **`npm start`**: Start production server
- **`npm run check`**: TypeScript type checking

### Database Management
- **`npm run db:push`**: Apply schema changes to database
- **`tsx scripts/simple-seed.ts`**: Initialize SQLite with sample data
- **`tsx scripts/setup-sqlite.ts`**: Full SQLite setup with tables and data

### Utility Scripts
- **`scripts/simple-seed.ts`**: Current working seed script for SQLite
- **`scripts/setup-sqlite.ts`**: Alternative setup with more advanced features
- **`scripts/test-connection.ts`**: Test database connectivity

## Current Architecture Decisions

### Database Choice: SQLite
**Reasoning**: After attempting Supabase migration, SQLite proved more reliable for this environment
- **Pros**: No external dependencies, fast setup, zero configuration
- **Cons**: Single user, file-based storage
- **Status**: Fully implemented and tested

### Session Management: MemoryStore
**Reasoning**: Compatible with SQLite, simpler than database-backed sessions
- **Implementation**: express-session with memorystore package
- **Limitation**: Sessions reset on server restart (acceptable for development)

### Boolean Storage: Integer Conversion
**Reasoning**: SQLite doesn't support boolean type natively
- **Implementation**: Store booleans as integers (0/1) in database queries
- **Affected Areas**: User admin status, room active status

## Troubleshooting History

### Resolved Issues
1. **React Query `enabled` prop errors**: Fixed by wrapping with `Boolean()` to ensure proper type
2. **SQLite boolean binding errors**: Converted all boolean queries to integer (0/1)
3. **Password update failures**: Fixed by using `.returning()` instead of `.rowCount` for SQLite
4. **Supabase connectivity timeouts**: Resolved by switching to local SQLite

### Known Limitations
- **Sessions**: Stored in memory, reset on server restart
- **Concurrent Access**: SQLite has limitations for multiple simultaneous users
- **Schema Changes**: Require manual script execution for SQLite

## Deployment Considerations

### Current Setup (Replit)
- **Database**: SQLite file in workspace
- **Sessions**: Memory-based
- **Static Assets**: Served by Vite in development
- **Build Process**: Available via `npm run build`

### Production Recommendations
- Consider PostgreSQL for multi-user production
- Implement Redis or database-backed sessions
- Set up proper logging and monitoring
- Configure environment-specific settings

## Development Workflow

### Making Changes
1. Modify code with hot reload active
2. Run `npm run check` for type verification
3. Test functionality manually
4. Update documentation in this file

### Database Updates
1. Modify `shared/schema.ts`
2. Run `npm run db:push` for schema changes
3. Update seed scripts if needed
4. Test with fresh database

### Adding Features
1. Plan schema changes first
2. Implement backend routes
3. Add frontend components
4. Update shared types
5. Test admin and user flows