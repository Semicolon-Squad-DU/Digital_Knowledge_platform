import { readFileSync } from "fs";
import { resolve } from "path";
import { pool } from "./pool";
import { logger } from "../config/logger";

async function main() {
  const schemaPath = resolve(__dirname, "init.sql");
  const schemaSql = readFileSync(schemaPath, "utf8");

  logger.info("Applying database schema", { schemaPath });

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(schemaSql);
    await client.query("COMMIT");
    logger.info("Database schema applied successfully");
  } catch (error) {
    await client.query("ROLLBACK");
    logger.error("Failed to apply database schema", {
      error: error instanceof Error ? error.message : String(error),
    });
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((error) => {
  logger.error("Unexpected migration failure", {
    error: error instanceof Error ? error.message : String(error),
  });
  process.exit(1);
});