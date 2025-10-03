# Overview

This is a marketplace application called "rest-express" designed for connecting buyers with sellers in Ghana's markets, particularly Makola Market. The platform supports multiple user types including buyers, sellers, kayayo (market porters), and riders, creating a comprehensive ecosystem for local market commerce and delivery services.

## Recent Changes

**2025-10-03**: Replit environment setup and configuration
- Imported GitHub project and configured for Replit environment
- Created and provisioned PostgreSQL database with Replit's built-in database service
- Pushed database schema to PostgreSQL using Drizzle ORM (`npm run db:push`)
- Seeded database with test users and sample data (run `tsx server/seed.ts`)
- Configured workflow to run on port 5000 with webview output type
- Updated .gitignore to exclude environment files and logs
- Verified application runs successfully with frontend and backend working correctly
- Application accessible at port 5000 with proper host configuration (0.0.0.0)

**2025-09-30**: Completed comprehensive admin portal with full operational control
- Built admin orders monitoring page with status filters, delay tracking, and order reassignment capabilities
- Implemented payments & escrow management dashboard with transaction tracking, freeze functionality, and CSV export
- Created disputes resolution system with evidence review, refund issuance, and penalty management
- Added disputes table to database schema with support for order-related disputes and resolutions
- Integrated all admin backend API routes with proper authentication and authorization
- Admin portal now provides complete oversight over users, orders, payments, and disputes

**2025-09-30**: Database and storage configuration
- Using PostgresStorage with Neon Database for data persistence
- Database schema synchronized with missing columns added (email, is_suspended, is_active)
- Configured workflow to run development server on port 5000 with webview output
- Verified build and deployment configuration for production

# Getting Started

## Test Credentials

The database has been seeded with the following test users:

- **Admin**: admin@makolaconnect.com / admin123
- **Buyer**: +233244123456 / password123  
- **Seller**: +233244987654 / password123
- **Kayayo**: +233244555666 / password123
- **Rider**: +233244666777 / password123

## Running the Project

The application is configured to run automatically. The workflow starts the development server on port 5000.

**Development server**: `npm run dev` - Runs Express server with Vite middleware for hot reloading
**Build for production**: `npm run build` - Builds both frontend and backend
**Start production**: `npm run start` - Runs the production build
**Database push**: `npm run db:push` - Pushes schema changes to the database
**Seed database**: `tsx server/seed.ts` - Seeds the database with test data

## Environment Variables

The following environment variables are automatically configured by Replit:
- `DATABASE_URL` - PostgreSQL connection string
- `SESSION_SECRET` - JWT secret for authentication
- `PORT` - Server port (default: 5000)

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Full-Stack Architecture

The application follows a modern full-stack architecture with a React frontend and Express.js backend, using TypeScript throughout for type safety.

**Frontend Framework**: React with TypeScript, using Vite as the build tool and development server. The client-side routing is handled by Wouter for lightweight navigation.

**Backend Framework**: Express.js server with TypeScript, featuring RESTful API endpoints and WebSocket support for real-time updates.

**Development Setup**: The project uses a monorepo structure with shared TypeScript schemas between client and server, enabling consistent data types across the full stack.

## Database Layer

**ORM and Database**: Drizzle ORM with PostgreSQL as the primary database, configured through Neon Database serverless connections for scalable cloud deployment.

**Schema Design**: The database schema includes tables for users, sellers, products, cart items, orders, reviews, kayayo availability, and disputes. All tables use UUID primary keys for better distribution and security. The disputes table supports order-related dispute management with evidence tracking and resolution workflows.

**Migrations**: Database schema changes are managed through Drizzle migrations with a dedicated configuration file.

## Authentication and Authorization

**JWT Authentication**: JSON Web Tokens are used for stateless authentication, with tokens stored in localStorage on the client side.

**User Types**: The system supports four distinct user roles (buyer, seller, kayayo, rider) with role-based access control implemented throughout the application.

**Session Management**: Authentication state is managed through React Context, providing global access to user information and authentication status.

## Real-Time Communication

**WebSocket Integration**: WebSocket server implementation for real-time updates, particularly useful for order status changes and availability updates.

**Client Connection Management**: WebSocket connections are managed per user with automatic reconnection handling.

## UI Component System

**Design System**: ShadCN UI components with Radix UI primitives, providing a consistent and accessible interface.

**Styling**: Tailwind CSS for utility-first styling with a custom design token system including CSS variables for theming.

**Mobile-First Design**: Responsive design optimized for mobile devices with dedicated mobile layout components.

## State Management

**Server State**: TanStack React Query for server state management, caching, and background updates.

**Client State**: React's built-in state management with Context API for global state like authentication.

**Form Handling**: React Hook Form with Zod schema validation for type-safe form management.

## API Architecture

**RESTful Design**: Standard REST endpoints for CRUD operations on all entities.

**Type Safety**: Shared TypeScript schemas ensure consistent data structures between client and server.

**Error Handling**: Centralized error handling with proper HTTP status codes and structured error responses.

# External Dependencies

**Database Service**: Neon Database (@neondatabase/serverless) for PostgreSQL hosting with serverless scaling capabilities.

**UI Component Library**: Extensive use of Radix UI primitives for accessible, unstyled components that are then styled with custom CSS.

**Development Tools**: Vite for fast development builds, PostCSS for CSS processing, and ESBuild for production bundling.

**Form Validation**: Zod for runtime type checking and schema validation, integrated with React Hook Form for seamless form handling.

**Date Handling**: date-fns library for date manipulation and formatting utilities.

**Authentication**: jsonwebtoken for JWT token creation and verification on the server side.

**Real-time Communication**: WebSocket (ws) library for server-side WebSocket implementation.

**Session Storage**: connect-pg-simple for PostgreSQL-based session storage when needed.

**Utility Libraries**: clsx and tailwind-merge for conditional CSS class handling, class-variance-authority for component variant management.