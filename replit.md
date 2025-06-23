# Replit MD - Arabic Accounting System

## Overview
This is a comprehensive Arabic accounting system built with modern web technologies. The application provides a complete financial management solution with multi-language support (primarily Arabic), user role management, transaction tracking, project management, and automated backup systems.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and optimized builds
- **Styling**: Tailwind CSS with custom Arabic font support (Cairo, Amiri, Tajawal)
- **UI Components**: Shadcn/UI components with Radix UI primitives
- **State Management**: React Query for server state management
- **Routing**: Client-side routing with React Router

### Backend Architecture  
- **Runtime**: Node.js 18+ with Express.js
- **Language**: TypeScript with ES modules
- **Database ORM**: Drizzle ORM for type-safe database operations
- **Session Management**: Express sessions with PostgreSQL storage
- **Authentication**: Session-based authentication with bcrypt password hashing

### Database Architecture
- **Primary Database**: PostgreSQL with Neon hosting
- **Backup Strategy**: Multi-tier backup system with local and cloud storage
- **Schema Management**: Drizzle migrations with comprehensive indexing
- **Performance**: Optimized indexes for faster query execution

## Key Components

### Core Modules
1. **User Management**: Role-based access control with granular permissions
2. **Project Management**: Multi-project support with user assignments
3. **Transaction System**: Comprehensive financial transaction tracking
4. **Document Management**: File upload and attachment system
5. **Reporting**: Financial reports with PDF/Excel export capabilities
6. **Backup System**: Automated backup every 12 hours with multiple storage options

### Database Schema
- **Users**: Authentication, roles, and permissions
- **Projects**: Project management with budget tracking
- **Transactions**: Financial transactions with file attachments
- **Documents**: Document storage and metadata
- **Activity Logs**: System audit trail
- **Settings**: Application configuration

### Permission System
- **Admin**: Full system access (14 permissions)
- **Manager**: Project and transaction management (11 permissions)
- **User**: Basic transaction operations (8 permissions)
- **Viewer**: Read-only access (5 permissions)

## Data Flow

### Authentication Flow
1. User login with username/password
2. Password verification with bcrypt
3. Session creation with PostgreSQL storage
4. Permission checking on each protected route

### Transaction Flow
1. Transaction creation with validation
2. File upload to local storage with backup to cloud
3. Database insertion with foreign key relationships
4. Activity logging for audit purposes

### Backup Flow
1. Automated backup every 12 hours
2. Database export to SQL format
3. File compression with archiver
4. Optional cloud storage sync (Supabase/Firebase)

## External Dependencies

### Database Services
- **Primary**: Neon PostgreSQL (production database)
- **Backup**: Supabase (cloud backup and file storage)
- **Alternative**: Firebase (additional backup option)

### Development Dependencies
- **TypeScript**: Type safety and developer experience
- **ESBuild**: Fast bundling for production builds
- **Drizzle Kit**: Database migrations and schema management

### UI/UX Libraries
- **Radix UI**: Accessible component primitives
- **Tailwind CSS**: Utility-first CSS framework
- **Lucide React**: Modern icon library
- **React Hook Form**: Form management with validation

## Deployment Strategy

### Build Process
1. Frontend build with Vite (optimized for production)
2. Backend build with ESBuild (Node.js compatible)
3. Database migration with Drizzle
4. Asset optimization and compression

### Hosting Options
1. **Replit**: Development and testing environment
2. **Netlify**: Static hosting with serverless functions
3. **Firebase**: Full-stack hosting with real-time features
4. **VPS**: Self-hosted deployment with PM2 process management

### Environment Configuration
- Development: Local PostgreSQL with file storage
- Production: Cloud PostgreSQL with multi-tier backup
- Environment variables for database URLs and API keys

## Changelog
- June 23, 2025. Initial setup

## User Preferences
Preferred communication style: Simple, everyday language.