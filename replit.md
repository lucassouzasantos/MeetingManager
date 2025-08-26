# Room Booking Management System

## Overview

This is a full-stack room booking management system built with React, TypeScript, Express.js, and PostgreSQL/Supabase. The application provides a comprehensive solution for managing meeting rooms and their bookings within an organization. Users can view available rooms, create bookings, and administrators have additional privileges to manage rooms and users.

The system features a modern, responsive interface built with shadcn/ui components and Tailwind CSS, offering both light and dark theme support. The application implements secure authentication with session management and role-based access control.

**Updated**: Sistema migrado para usar Supabase como banco de dados para execução local e deployment independente.

## User Preferences

Preferred communication style: Simple, everyday language.

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

The application uses **PostgreSQL** with Drizzle ORM for database operations:

- **Users Table**: Stores user credentials, profile information, and admin status
- **Rooms Table**: Contains room details including name, location, capacity, and active status
- **Bookings Table**: Manages booking records with foreign keys to users and rooms
- **Relationships**: Properly defined foreign key constraints and relations between entities
- **Schema Validation**: Zod schemas ensure data integrity at both API and database levels

### Authentication & Authorization

The system implements a robust authentication mechanism:

- **Session-based Authentication**: Secure session management with PostgreSQL session store
- **Role-based Access Control**: Differentiates between regular users and administrators
- **Password Security**: Uses scrypt hashing with salt for secure password storage
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
- **@neondatabase/serverless**: PostgreSQL database connection with serverless support
- **drizzle-orm**: Type-safe ORM for database operations and query building
- **@tanstack/react-query**: Server state management and data fetching library
- **passport**: Authentication middleware for Express.js applications
- **express-session**: Session management middleware with PostgreSQL store

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