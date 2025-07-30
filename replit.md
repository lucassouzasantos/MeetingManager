# Replit.md

## Overview
This is a full-stack room booking system built with Express.js backend and React frontend. The application allows users to book meeting rooms, manage their reservations, and provides admin functionality for room management. The system uses PostgreSQL with Drizzle ORM for data persistence and includes comprehensive authentication with session management.

## User Preferences
Preferred communication style: Simple, everyday language.
User interface preferences: Clear form fields after successful operations, user-friendly error messages for booking conflicts.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **UI Library**: Radix UI components with shadcn/ui styling system
- **Styling**: Tailwind CSS with CSS variables for theming
- **State Management**: TanStack Query for server state management
- **Routing**: Wouter for client-side routing
- **Forms**: React Hook Form with Zod validation
- **Build Tool**: Vite with custom configuration for monorepo structure

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Passport.js with local strategy and session-based auth
- **Session Storage**: PostgreSQL session store using connect-pg-simple
- **Password Security**: Node.js crypto module with scrypt hashing
- **API Design**: RESTful endpoints with structured error handling

### Database Schema
- **Users**: ID, username, password, full name, position, email, admin flag
- **Rooms**: ID, name, location, capacity, active status
- **Bookings**: ID, title, description, date/time, user/room references, status

## Key Components

### Authentication System
- Session-based authentication using Passport.js
- Secure password hashing with scrypt and salt
- Admin role-based access control
- Protected routes on both frontend and backend

### Room Management
- CRUD operations for rooms (admin only)
- Room capacity and location tracking
- Active/inactive room status management
- Booking conflict detection system

### Booking System
- Date and time-based reservations
- User-specific booking history
- Real-time conflict validation
- Status tracking (confirmed, pending, cancelled)

### Frontend Features
- Responsive design with mobile support
- Real-time form validation
- Toast notifications for user feedback
- Loading states and error handling
- Protected route system

## Data Flow

1. **Authentication Flow**: User credentials → Passport verification → Session creation → User object in request
2. **Booking Flow**: Form submission → Validation → Conflict check → Database insertion → UI update
3. **Room Management**: Admin form → Backend validation → Database update → Cache invalidation
4. **Data Fetching**: TanStack Query → API endpoints → Database queries → Cached responses

## External Dependencies

### Database
- **Neon PostgreSQL**: Serverless PostgreSQL database
- **Connection**: WebSocket-based connection with connection pooling
- **Migrations**: Drizzle Kit for schema management

### UI Components
- **Radix UI**: Accessible component primitives
- **Lucide React**: Icon library
- **Date-fns**: Date manipulation utilities
- **Embla Carousel**: Carousel functionality

### Development Tools
- **ESBuild**: Server-side bundling for production
- **Replit Integration**: Development banner and error overlay
- **TypeScript**: Static type checking across the stack

## Deployment Strategy

### Development
- Vite dev server with HMR for frontend
- tsx for TypeScript execution in development
- Concurrent frontend and backend development setup

### Production Build
- Vite builds optimized frontend bundle to `dist/public`
- ESBuild bundles server code to `dist/index.js`
- Static file serving through Express in production

### Environment Configuration
- DATABASE_URL for PostgreSQL connection
- SESSION_SECRET for session security
- NODE_ENV for environment-specific behavior

### Key Architectural Decisions

1. **Monorepo Structure**: Single repository with shared schema between frontend and backend for type safety
2. **Session-based Auth**: Chosen over JWT for better security and server-side session management
3. **Drizzle ORM**: Selected for type-safe database operations and excellent TypeScript integration
4. **TanStack Query**: Implemented for efficient server state management and caching
5. **Zod Validation**: Used for runtime type validation on both client and server
6. **PostgreSQL**: Chosen for ACID compliance and robust relational data handling

## Recent Changes

### January 30, 2025 - Error Handling and UX Improvements
- Fixed React hooks error in authentication page using useEffect
- Improved error handling for booking conflicts with user-friendly messages
- Added form field clearing after successful booking/room creation
- Created 5 sample rooms in the database for testing
- Added session secret configuration for authentication
- Enhanced TypeScript error handling in form components