# DKP Setup Guide for Teammates

This guide explains how to set up the Digital Knowledge Platform (DKP) with the shared Supabase database so all teammates see the same data.

## Prerequisites

- Node.js v18+ installed
- npm or yarn installed
- Supabase account (provided by team lead)

## Step 1: Clone & Install

```bash
git clone https://github.com/Yukii9291/Digital_Knowledge_platform.git
cd Digital_Knowledge_platform

npm install
npm install --workspace=apps/backend
npm install --workspace=apps/frontend
npm install --workspace=packages/shared
```

## Step 2: Get the Supabase Connection String

Ask your team lead (Sifat) for the **Supabase Session Pooler connection string**.  
It will look like:
```
postgresql://postgres.dpwieffcwvfolurptyic:PASSWORD@aws-1-ap-south-1.pooler.supabase.com:5432/postgres?...
```

Do **NOT** ask for the private database password separately—it's embedded in the connection string.

## Step 3: Configure Your Backend

1. Navigate to `apps/backend/`
2. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
3. Open `.env` and update the `DATABASE_URL` with the connection string from Step 2:
   ```
   DATABASE_URL=postgresql://postgres.dpwieffcwvfolurptyic:PASSWORD@aws-1-ap-south-1.pooler.supabase.com:5432/postgres?uselibpqcompat=true&sslmode=require
   ```
4. Keep all other environment variables as default (they work for local Redis, Elasticsearch, etc.)

## Step 4: Verify Database Connection

Run the migration to verify your connection works:

```bash
cd apps/backend
npm run db:migrate
```

If successful, you'll see:
```
info: Database schema applied successfully
```

## Step 5: (Optional) Seed Demo Data

If the database is empty, seed it with demo data:

```bash
npm run db:seed
```

This adds:
- Demo users (Admin, Librarian, Researcher, Student)
- Sample archive items, research outputs, and projects
- Demo catalog entries and announcements

**Note:** The team lead already seeded the database, so you usually don't need to run this again.

## Step 6: Start Development

From the project root:

```bash
npm run dev:full
```

This starts:
- Frontend on `http://localhost:3000`
- Backend on `http://localhost:4000`

Both connect to the **same shared Supabase database**, so you'll all see identical data.

## Demo Credentials

All users have password: `Test@123456`

- **Admin:** admin@dkp.edu.bd
- **Librarian:** librarian@dkp.edu.bd
- **Researcher:** researcher@dkp.edu.bd
- **Student:** student@dkp.edu.bd

## Troubleshooting

### "connection refused"

- Check that DATABASE_URL has `uselibpqcompat=true&sslmode=require`
- Verify your internet connection

### "No data visible"

- Confirm DATABASE_URL is pointing to Supabase (not localhost)
- Run `npm run db:seed` if the database is empty

### "Permission denied"

- Verify the password in DATABASE_URL is correct
- Ask the team lead for a fresh connection string

## Important: DO NOT Commit .env

Your `.env` file is in `.gitignore` and should NEVER be committed.  
Always keep database passwords private.

## Backend Architecture

- `src/core/db/pool.ts` — database connection pool
- `src/core/db/init.sql` — schema (applied via `npm run db:migrate`)
- `src/core/db/seed.ts` — demo data (applied via `npm run db:seed`)
- `src/features/*/` — API routes per domain (auth, archive, library, etc.)
- `src/infrastructure/` — external integrations (S3, Email, Elasticsearch)
- `src/core/middleware/` — auth, error handling, audit logging, uploads

## Frontend Architecture

- `apps/frontend/src/app/` — Next.js App Router pages and layouts
- `apps/frontend/src/features/<domain>/` — domain hooks and components (archive, library, showcase, research, notifications)
- `apps/frontend/src/components/ui/` — shared UI primitives
- `apps/frontend/src/components/layout/` — layout (e.g. Navbar)
- `apps/frontend/src/lib/api.ts` — axios client to backend

## Questions?

Ask your team lead or check the project documentation in `document.md`.

---

## Known: Supabase `users` table schema

The live `public.users` table on Supabase contains ~50 extra columns beyond what `init.sql` defines
(`encrypted_password`, `is_super_admin`, `banned_until`, `is_anonymous`, etc.). These are Supabase
Auth internal columns added automatically when the project was provisioned — **they are not a code bug**.

All backend queries explicitly name their columns rather than using `SELECT *`, so the extra columns
are invisible at the application layer and auth continues to work normally. **Do not drop these columns
— they are managed by Supabase's own Auth service.**

If you ever need a fresh Supabase project, apply `apps/backend/src/core/db/init.sql` first, then
run `db:migrate` for each incremental migration file in `src/core/db/migrations/`.

**Last Updated:** April 24, 2026

