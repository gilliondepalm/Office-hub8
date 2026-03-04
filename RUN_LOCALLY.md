# Running Kantoor Dashboard Locally

## Prerequisites

Install the following software before starting:

| Software   | Version     | Notes                                      |
|------------|-------------|--------------------------------------------|
| Node.js    | 20 or higher | Download from https://nodejs.org           |
| npm        | 10 or higher | Included with Node.js                      |
| PostgreSQL | 14 or higher | Download from https://www.postgresql.org   |

## Environment Variables

| Variable         | Required    | Description                                                                                      |
|------------------|-------------|--------------------------------------------------------------------------------------------------|
| `DATABASE_URL`   | Yes         | PostgreSQL connection string, e.g. `postgresql://username:password@localhost:5432/kantoor_dashboard` |
| `SESSION_SECRET` | Recommended | A long random string for securing login sessions. A temporary one is auto-generated if not set, but this is not suitable for production. |
| `PORT`           | No          | The port the server listens on. Defaults to `5000`.                                              |
| `NODE_ENV`       | No          | Set to `production` for production mode. Defaults to `development`.                              |

On Linux/macOS you can set these in your terminal before running:

```bash
export DATABASE_URL="postgresql://username:password@localhost:5432/kantoor_dashboard"
export SESSION_SECRET="your-long-random-secret-string-here"
```

On Windows (PowerShell):

```powershell
$env:DATABASE_URL = "postgresql://username:password@localhost:5432/kantoor_dashboard"
$env:SESSION_SECRET = "your-long-random-secret-string-here"
```

## Setup Steps

1. **Create a PostgreSQL database**

   ```sql
   CREATE DATABASE kantoor_dashboard;
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Create the database tables**

   ```bash
   npm run db:push
   ```

   This will prompt you to confirm creation of each table. Press enter/confirm for each one.

4. **Start the application**

   For development (with hot-reload):

   ```bash
   npm run dev
   ```

   For production:

   ```bash
   npm run build
   npm start
   ```

5. **Open the application**

   Navigate to `http://localhost:5000` in your browser.

## First Launch

On the very first run with an empty database, the app will show a setup screen where you create the initial administrator account. After that you log in normally and can manage all users from the Beheer module.

In development mode (`NODE_ENV=development`), demo seed data is automatically loaded with the following sample accounts:

| Username | Password  | Role      |
|----------|-----------|-----------|
| admin    | admin123  | admin     |
| manager  | user123   | manager   |
| pieter   | user123   | employee  |
| sophie   | user123   | employee  |
| thomas   | user123   | employee  |

In production mode (`NODE_ENV=production`), seeding is skipped entirely. You create all accounts through the setup screen and Beheer module.

## Upload Directories

The app stores uploaded files on disk. These directories are created automatically when needed:

| Directory                          | Contents                        |
|------------------------------------|---------------------------------|
| `uploads/Aankondigingen/`          | Announcement PDF attachments    |
| `uploads/CAO/`                     | Collective labor agreement docs |
| `uploads/Wetgeving/`               | Legislation documents           |
| `uploads/Nieuwsbrief/`             | Newsletter files                |
| `uploads/Instructies/{department}/`| Department instruction files    |
| `uploads/public/`                  | Profile photos and public images|

## Database Tables

All 22+ tables are created automatically by `npm run db:push`. These include: users, events, announcements, departments, absences, rewards, applications, app_access, messages, ao_procedures, ao_instructions, position_history, personal_development, legislation_links, cao_documents, site_settings, functionering_reviews, competencies, beoordeling_reviews, beoordeling_scores, jaarplan_items, yearly_awards, help_content, and a session table for login sessions.

## Replit-Specific Items

The following files and packages are only used in the Replit hosting environment and can be safely ignored or removed when running locally:

- `.replit` file — Replit run configuration
- `replit.nix` — Replit system package definitions
- `replit.md` — Replit agent memory file

Three Vite dev plugins are Replit-specific but will not activate on your machine (they check for the `REPL_ID` environment variable):

- `@replit/vite-plugin-cartographer`
- `@replit/vite-plugin-dev-banner`
- `@replit/vite-plugin-runtime-error-modal`

You can optionally remove these from `package.json` devDependencies and from `vite.config.ts` if you want a cleaner setup.

## Troubleshooting

- **`DATABASE_URL` error on startup** — Make sure your PostgreSQL server is running and the connection string is correct.
- **Port already in use** — Set a different port with `export PORT=3000` (or any available port).
- **`db:push` hangs or fails** — Ensure the database exists and the user in your connection string has permission to create tables.
- **Uploads not working** — Make sure the application has write permission to the project directory so it can create the `uploads/` folders.
