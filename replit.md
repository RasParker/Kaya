# Overview

This is a marketplace application called "rest-express" designed for connecting buyers with sellers in Ghana's markets, particularly Makola Market. The platform supports multiple user types including buyers, sellers, kayayo (market porters), and riders, creating a comprehensive ecosystem for local market commerce and delivery services.

## Recent Changes

**2025-10-08**: UI/UX improvements and bug fixes
- Fixed kayayo page blank issue in cart - resolved React hooks being called conditionally causing rendering errors
- Fixed delivery address save functionality - delivery_addresses table schema properly migrated to database
- Fixed order status tracking dot highlighting - implemented proper status-based highlighting for order progress visualization
- Implemented complete user avatar upload feature with Cloudinary integration
  - Added file upload UI with image preview in account settings
  - Supports file size validation (max 5MB) and format selection (JPG, PNG, GIF)
  - Includes avatar removal functionality with proper backend clearing
  - Base64 images automatically uploaded to Cloudinary and stored as secure URLs
- Enhanced rider verification code system for kayayo handover
  - Added expected verification code display in kayayo order details during rider handover
  - Kayayo can now see what code the rider should show before confirming handover
  - Improved security and user experience for order handoff process

**2025-10-07**: Database migration to Supabase and image storage migration to Cloudinary
- Successfully migrated from Replit's built-in PostgreSQL database to Supabase
- Database schema pushed to Supabase using Drizzle ORM (`npm run db:push`)
- Integrated Cloudinary for cloud-based image storage and management
- Updated product creation and update endpoints to automatically upload images to Cloudinary
- Base64 images are now converted to secure Cloudinary URLs before storage
- All test data re-seeded successfully in Supabase database
- Environment variables configured: DATABASE_URL (Supabase), CLOUDINARY_URL
- Application tested and verified working with both new services

**2025-10-06**: User flow bug fixes
- Fixed kayayo profile navigation - now correctly uses kayayo user ID instead of availability record ID
- Added GET /api/orders/:id endpoint with proper role-based access control for fetching individual orders
- Created dedicated PATCH /api/orders/:id/accept endpoint for kayayos to accept shopping orders
- Fixed floating button positioning on cart and payment pages with proper z-index and styling
- Fixed seller filter on browse page - updated all seller card navigation (buyer dashboard, sellers page, browse page) to use 'sellerId' query parameter consistently

**2025-10-06**: Automatic database seeding on startup
- Implemented automatic database seeding that runs on every application startup
- Seed checks if test users already exist to avoid duplicates
- Ensures all 5 test users (admin, buyer, seller, kayayo, rider) are always available
- Creates 30 sample products across 7 categories (vegetables, roots, fruits, fish, grains, spices, household)
- Sets up seller profile and kayayo availability automatically
- Test logins now work immediately without manual database seeding

**2025-10-04**: Quick test login feature added
- Added tabbed login interface with "Manual Login" and "Test Logins" tabs
- Test Logins tab provides one-click authentication for all user types
- Properly handles both email-based (admin) and phone-based (other users) authentication
- Simplified database seeding to include only 1 test user per role (5 users total)

**2025-10-04**: GitHub import successfully completed
- Imported GitHub project and configured for Replit environment
- Installed all Node.js dependencies via npm
- Created and provisioned PostgreSQL database with Replit's built-in database service
- Database schema verified and matches code schema 100%
- Configured workflow "Start application" to run on port 5000 with webview output type
- Application running successfully with frontend accessible and backend APIs operational
- Server configured with proper host settings (0.0.0.0) for Replit proxy compatibility
- Deployment configuration set for autoscale production deployment

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

The following environment variables are configured in Replit Secrets:
- `DATABASE_URL` - Supabase PostgreSQL connection string
- `CLOUDINARY_URL` - Cloudinary cloud storage connection string (format: cloudinary://api_key:api_secret@cloud_name)
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

**ORM and Database**: Drizzle ORM with PostgreSQL as the primary database, hosted on Supabase for scalable cloud deployment with built-in authentication and real-time features.

**Schema Design**: The database schema includes tables for users, sellers, products, cart items, orders, reviews, kayayo availability, and disputes. All tables use UUID primary keys for better distribution and security. The disputes table supports order-related dispute management with evidence tracking and resolution workflows.

**Migrations**: Database schema changes are managed through Drizzle with `npm run db:push` command to sync schema changes to Supabase.

## Image Storage

**Cloud Storage**: Cloudinary integration for secure, scalable image storage and delivery with automatic optimization.

**Image Upload Flow**: When products are created or updated, base64-encoded images are automatically uploaded to Cloudinary and stored as secure URLs in the database.

**Organization**: All product images are stored in the `makola-connect/products` folder within Cloudinary for organized asset management.

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

**Database Service**: Supabase for PostgreSQL database hosting with serverless scaling, built-in authentication, and real-time capabilities.

**Image Storage**: Cloudinary for cloud-based image storage, optimization, and delivery with automatic format conversion and responsive image generation.

**UI Component Library**: Extensive use of Radix UI primitives for accessible, unstyled components that are then styled with custom CSS.

**Development Tools**: Vite for fast development builds, PostCSS for CSS processing, and ESBuild for production bundling.

**Form Validation**: Zod for runtime type checking and schema validation, integrated with React Hook Form for seamless form handling.

**Date Handling**: date-fns library for date manipulation and formatting utilities.

**Authentication**: jsonwebtoken for JWT token creation and verification on the server side.

**Real-time Communication**: WebSocket (ws) library for server-side WebSocket implementation.

**Session Storage**: connect-pg-simple for PostgreSQL-based session storage when needed.

**Utility Libraries**: clsx and tailwind-merge for conditional CSS class handling, class-variance-authority for component variant management.