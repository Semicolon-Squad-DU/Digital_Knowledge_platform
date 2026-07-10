import { Pool } from "pg";
import fs from "node:fs";
import path from "node:path";

const TEST_DATABASE_URL =
  process.env.TEST_DATABASE_URL ||
  "postgresql://dkp_test_user:dkp_test_password@localhost:5433/dkp_test";

export const FIXTURE_FILE = path.resolve(__dirname, ".fixtures.json");

/**
 * Seeds the disposable test database directly (same pattern as the backend's
 * *.integration.test.ts files) so specs have known, unique records to search
 * for and navigate to — without needing to drive the full signup/OTP flow
 * through the UI just to get a logged-in session for read-only checks.
 */
export default async function globalSetup() {
  const pool = new Pool({ connectionString: TEST_DATABASE_URL });
  const suffix = Date.now();

  const archivist = await pool.query(
    `INSERT INTO users (name, email, password_hash, role)
     VALUES ('E2E Archivist', $1, 'x', 'archivist')
     RETURNING user_id`,
    [`e2e-archivist-${suffix}@test.local`]
  );
  const uploaderId = archivist.rows[0].user_id;

  const publicBookTitle = `E2E Playwright Public Book ${suffix}`;
  await pool.query(
    `INSERT INTO catalog_items (title, category, total_copies, available_copies)
     VALUES ($1, 'Test', 2, 2)`,
    [publicBookTitle]
  );

  const publicArchiveTitle = `E2E Playwright Public Archive Doc ${suffix}`;
  const publicArchive = await pool.query(
    `INSERT INTO archive_items (title_en, category, access_tier, status, file_url, file_type, file_size, uploaded_by)
     VALUES ($1, 'Test', 'public', 'published', 'archive/e2e-public.pdf', 'application/pdf', 2048, $2)
     RETURNING item_id`,
    [publicArchiveTitle, uploaderId]
  );

  const restrictedArchiveTitle = `E2E Playwright Restricted Archive Doc ${suffix}`;
  const restrictedArchive = await pool.query(
    `INSERT INTO archive_items (title_en, category, access_tier, status, file_url, file_type, file_size, uploaded_by)
     VALUES ($1, 'Test', 'restricted', 'published', 'archive/e2e-restricted.pdf', 'application/pdf', 2048, $2)
     RETURNING item_id`,
    [restrictedArchiveTitle, uploaderId]
  );

  await pool.end();

  fs.writeFileSync(
    FIXTURE_FILE,
    JSON.stringify(
      {
        suffix,
        uploaderId,
        publicBookTitle,
        publicArchiveTitle,
        restrictedArchiveTitle,
        restrictedArchiveId: restrictedArchive.rows[0].item_id,
        publicArchiveId: publicArchive.rows[0].item_id,
      },
      null,
      2
    )
  );
}
