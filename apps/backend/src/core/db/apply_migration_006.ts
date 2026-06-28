import { pool } from "./pool";
import { readFileSync } from "fs";
import { resolve } from "path";

async function main() {
  const sqlPath = resolve(__dirname, "migrations", "006_catalog_document_url.sql");
  const sql = readFileSync(sqlPath, "utf8");
  console.log("Applying sql from", sqlPath);

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(sql);
    await client.query("COMMIT");
    console.log("Migration 006 applied successfully!");
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Migration failed:", err);
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch(console.error);
