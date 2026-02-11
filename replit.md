# Kantoor Dashboard

## Overview
A comprehensive office dashboard application with 7 modules for managing office operations. Built with React/Express/PostgreSQL.

## Architecture
- **Frontend**: React with TypeScript, Tailwind CSS, shadcn/ui components
- **Backend**: Express.js with TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Auth**: Session-based authentication with bcrypt password hashing

## Modules
1. **Dashboard** - Overview with stats, upcoming events, recent announcements, pending absences
2. **Evenementen Kalender** - Event management with categories (vergadering, training, sociaal, deadline)
3. **Aankondigingen** - Announcements with priority levels and pinning
4. **Organisatie** - Department management with member counts
5. **Personalia** - Employee directory with roles and departments
6. **Verzuim** - Absence/leave management with approval workflow
7. **Beloningsysteem** - Points-based rewards with leaderboard
8. **Applicaties** - Application access management with user permissions

## Authentication
- Session-based with PostgreSQL session store
- Demo credentials: admin/admin123, manager/user123, pieter/user123, sophie/user123, thomas/user123
- Roles: admin, manager, employee (different permissions per role)

## Key Files
- `shared/schema.ts` - All data models and Zod schemas
- `server/routes.ts` - All API endpoints
- `server/storage.ts` - Database operations
- `server/seed.ts` - Sample data seeding
- `server/db.ts` - Database connection
- `client/src/App.tsx` - Main app with routing and layout
- `client/src/lib/auth.tsx` - Authentication context
- `client/src/pages/` - All page components

## API Routes
All routes prefixed with `/api/` and require authentication except login.
- POST /api/auth/login, GET /api/auth/me, POST /api/auth/logout
- GET/POST/DELETE /api/events, /api/announcements, /api/departments, /api/users
- GET/POST /api/absences, PATCH /api/absences/:id (approve/reject)
- GET/POST /api/rewards, GET /api/rewards/leaderboard
- GET/POST/DELETE /api/applications, /api/app-access
- GET /api/dashboard/stats

## Running Locally
```bash
npm install
npm run db:push
npm run dev
```
