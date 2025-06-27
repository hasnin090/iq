# Replit.md - Arabic Accounting System

## Overview

This is a comprehensive Arabic accounting system built with modern web technologies. The system provides complete financial management capabilities including transaction tracking, project management, user administration, and multi-cloud storage with backup systems.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and optimized builds
- **UI Library**: Tailwind CSS with Shadcn/UI components
- **State Management**: TanStack React Query for server state
- **Styling**: PostCSS with custom theme system
- **Language**: Arabic-first interface with RTL support

### Backend Architecture
- **Runtime**: Node.js with Express.js server
- **Language**: TypeScript with ES modules
- **Database ORM**: Drizzle ORM with PostgreSQL
- **Session Management**: Express sessions with PostgreSQL store
- **Authentication**: Session-based with bcrypt password hashing
- **File Handling**: Multer for uploads with local/cloud storage

### Database Strategy
- **Primary**: PostgreSQL via Neon Database with Drizzle ORM
- **Backup**: Automatic failover to backup database instance
- **Cloud Backup**: Supabase integration for redundancy
- **Schema**: Comprehensive schema with users, projects, transactions, documents, and audit logs

## Key Components

### Database Schema
- **Users**: Role-based access control with permissions
- **Projects**: Financial project management with user assignments
- **Transactions**: Income/expense tracking with file attachments
- **Documents**: Document management with metadata
- **Activity Logs**: Complete audit trail of system actions
- **Settings**: Configurable system parameters
- **Expense Types**: Categorization system for financial tracking

### Storage Management
- **Primary**: Local file system storage
- **Backup**: Supabase Storage for cloud redundancy
- **Optional**: Firebase Storage as secondary backup
- **Features**: Automatic file migration, orphaned file cleanup, and attachment recovery

### Security & Permissions
- **Authentication**: Session-based with secure password hashing
- **Authorization**: Granular permissions system with role inheritance
- **Roles**: Admin, Manager, User, Viewer with different access levels
- **Session Storage**: PostgreSQL-backed sessions for scalability

### Backup System
- **Frequency**: Automatic backups every 12 hours
- **Content**: Complete database export with file attachments
- **Format**: Compressed ZIP archives with JSON data exports
- **Storage**: Local backup directory with cloud sync capabilities

## Data Flow

### Request Processing
1. Client requests hit Express middleware stack
2. Session authentication validates user identity
3. Permission middleware checks user authorization
4. Route handlers process business logic using storage layer
5. Database operations through Drizzle ORM with failover support
6. File operations through storage manager with multi-provider support

### File Upload Flow
1. Multer processes file uploads with validation
2. Storage manager determines optimal storage provider
3. Files saved to local storage with metadata
4. Optional cloud backup to Supabase/Firebase
5. Database updated with file references and metadata

### Database Failover
1. Primary database connection monitored for health
2. Automatic failover to backup database on failure
3. Transparent operation continuation for users
4. Background synchronization when primary recovers

## External Dependencies

### Required Services
- **Database**: PostgreSQL (Neon Database recommended)
- **Session Store**: PostgreSQL for session persistence

### Optional Cloud Services
- **Supabase**: Cloud database and storage backup
- **Firebase**: Alternative cloud storage and authentication
- **WhatsApp Business API**: File reception via WhatsApp messages

### Development Dependencies
- **TypeScript**: Type safety and development experience
- **Vite**: Fast development server and build tool
- **Drizzle Kit**: Database migrations and schema management
- **ESBuild**: Production build optimization

## Deployment Strategy

### Local Development
- Vite dev server for frontend with HMR
- tsx for TypeScript server execution
- PostgreSQL connection for data persistence
- Local file storage for development

### Production Build
- Vite builds optimized static assets to `dist/public`
- ESBuild compiles server code to `dist/index.js`
- Environment-based configuration
- Automatic database migrations on startup

### Deployment Options
- **Replit**: Native support with automatic deployment
- **Cloud Run**: Google Cloud Run deployment ready
- **VPS**: Traditional server deployment with PM2
- **Netlify**: Serverless deployment with Netlify Functions
- **Firebase Hosting**: Static hosting with Cloud Functions

### Environment Configuration
- `.env.example` provides template for required variables
- Database URL configuration for multiple providers
- Optional cloud service credentials
- Session secrets and security configuration

## Changelog

- June 27, 2025: **Netlify deployment login issue resolved** - Fixed serverless authentication by implementing in-memory session management for Netlify Functions, created complete deployment package with `server-simple.js` function
- June 26, 2025: **Currency standardization completed** - Unified all monetary displays to Iraqi Dinar (دينار عراقي) across the entire system
- June 26, 2025: **Comprehensive system testing completed** - All components tested and verified working
- June 26, 2025: **Document management library with manual linking** - Users can now upload documents once and manually link them to multiple financial transactions
- June 26, 2025: **Database schema enhanced** - Added `document_transaction_links` table for manual document-transaction associations
- June 26, 2025: **New APIs implemented** - `/api/documents/unlinked`, `/api/transactions/linkable`, document linking/unlinking endpoints
- June 26, 2025: **System refactoring completed** - 15% code reduction with improved maintainability through centralized mutation hooks
- June 26, 2025: Added WhatsApp Business API integration for file reception
- June 24, 2025: File organization - separated core files from Replit documentation
- June 24, 2025: GitHub preparation - added README, LICENSE, .gitignore, and upload guide
- June 24, 2025: Admin-only attachment deletion functionality completed  
- June 24, 2025: Initial setup

## User Preferences

Preferred communication style: Simple, everyday language.