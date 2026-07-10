import { Pool } from "pg";
import fs from "node:fs";
import { FIXTURE_FILE } from "./global-setup";

const TEST_DATABASE_URL =
  process.env.TEST_DATABASE_URL ||
  "postgresql://dkp_test_user:dkp_test_password@localhost:5433/dkp_test";

export default async function globalTeardown() {
  if (!fs.existsSync(FIXTURE_FILE)) return;
  const fixtures = JSON.parse(fs.readFileSync(FIXTURE_FILE, "utf8"));

  const pool = new Pool({ connectionString: TEST_DATABASE_URL });
  await pool.query("DELETE FROM archive_items WHERE uploaded_by = $1", [fixtures.uploaderId]).catch(() => {});
  await pool.query("DELETE FROM catalog_items WHERE title = $1", [fixtures.publicBookTitle]).catch(() => {});
  await pool.query("DELETE FROM users WHERE user_id = $1", [fixtures.uploaderId]).catch(() => {});
  await pool.end();

  fs.unlinkSync(FIXTURE_FILE);
}
