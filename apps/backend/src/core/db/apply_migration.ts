import { readFileSync } from "fs";
import { resolve } from "path";
import { pool } from "./pool";
import { logger } from "../config/logger";

async function main() {
  const file = process.argv[2] || "009_email_verification.sql";
  const sql = readFileSync(resolve(__dirname, "migrations", file), "utf8");
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(sql);
    await client.query("COMMIT");
    logger.info(`Migration ${file} applied successfully`);
  } catch (err) {
    await client.query("ROLLBACK");
    logger.error(`Migration ${file} failed`, { error: (err as Error).message });
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch(e => { console.error(e); process.exit(1); });
