## vendor/pgsql-bin

Portable `pg_dump.exe` / `psql.exe` (+ required DLLs) used by
`src/infrastructure/backup.service.ts` on machines where PostgreSQL client
tools aren't installed system-wide (e.g. this repo's Windows dev setup).

Must match (or exceed) the target database's major version — pg_dump refuses
to run against a newer server. The configured Supabase database runs
PostgreSQL 17, so this vendors v17 client tools, matching
`postgresql17-client` in `apps/backend/Dockerfile`. Update both together if
the database is upgraded.

Not committed to git (see root `.gitignore`) — regenerate if missing:

1. Download the matching EDB "binaries" zip, e.g.:
   `https://get.enterprisedb.com/postgresql/postgresql-17.10-1-windows-x64-binaries.zip`
2. Extract the `pgsql/bin/` folder from the zip into `apps/backend/vendor/pgsql-bin/`.

In Docker/production this folder doesn't exist — `postgresql17-client` is
installed on PATH in `apps/backend/Dockerfile` instead, and
`resolveBinary()` falls back to that automatically.
