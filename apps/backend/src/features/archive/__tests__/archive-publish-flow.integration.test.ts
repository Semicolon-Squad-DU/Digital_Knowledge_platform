import express from "express";
import request from "supertest";
import jwt from "jsonwebtoken";
import { Pool } from "pg";
import archiveRoutes from "../archive.routes";
import { errorHandler, notFound } from "../../../core/middleware/error.middleware";

/**
 * SDD §7 E2E target TC-TXX-001: Archivist uploads a document, saves it as
 * Draft, publishes it, and the item becomes discoverable in public search —
 * while still hidden from the public at every earlier lifecycle stage.
 * (TC-TXX-007, "restricted item access denied", is already covered by
 * archive.routes.integration.test.ts and isn't duplicated here.)
 */
const app = express();
app.use(express.json());
app.use("/api/archive", archiveRoutes);
app.use(notFound);
app.use(errorHandler);

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

function tokenFor(user_id: string, role: string): string {
  return jwt.sign({ user_id, email: `${role}@test.local`, role }, process.env.JWT_SECRET as string, {
    expiresIn: "15m",
  });
}

let archivistId: string;
let itemId: string;
const uniqueTitle = `E2E Publish Flow Test Doc ${Date.now()}`;

beforeAll(async () => {
  const archivist = await pool.query(
    `INSERT INTO users (name, email, password_hash, role)
     VALUES ('Test Archivist E2E', 'archivist-publish-it@test.local', 'x', 'archivist')
     RETURNING user_id`
  );
  archivistId = archivist.rows[0].user_id;

  const item = await pool.query(
    `INSERT INTO archive_items (title_en, category, access_tier, status, file_url, file_type, file_size, uploaded_by)
     VALUES ($1, 'Test', 'public', 'draft', 'archive/publish-flow-test.pdf', 'application/pdf', 2048, $2)
     RETURNING item_id`,
    [uniqueTitle, archivistId]
  );
  itemId = item.rows[0].item_id;
});

afterAll(async () => {
  await pool.query("DELETE FROM archive_items WHERE item_id = $1", [itemId]).catch(() => {});
  await pool.query("DELETE FROM audit_logs WHERE user_id = $1", [archivistId]).catch(() => {});
  await pool.query("DELETE FROM users WHERE user_id = $1", [archivistId]).catch(() => {});
  await pool.end();
});

describe("Archive lifecycle: draft → review → published (TC-TXX-001)", () => {
  it("does not surface a draft item in public search", async () => {
    const res = await request(app).get("/api/archive/search").query({ query: uniqueTitle });
    expect(res.status).toBe(200);
    const titles = (res.body.data.items as { title_en: string }[]).map((i) => i.title_en);
    expect(titles).not.toContain(uniqueTitle);
  });

  it("moves draft → review as the archivist", async () => {
    const res = await request(app)
      .patch(`/api/archive/${itemId}/status`)
      .set("Authorization", `Bearer ${tokenFor(archivistId, "archivist")}`)
      .send({ status: "review" });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe("review");
  });

  it("still hides the item from public search while in review", async () => {
    const res = await request(app).get("/api/archive/search").query({ query: uniqueTitle });
    const titles = (res.body.data.items as { title_en: string }[]).map((i) => i.title_en);
    expect(titles).not.toContain(uniqueTitle);
  });

  it("a guest gets a 404 fetching the item directly while it's unpublished", async () => {
    const res = await request(app).get(`/api/archive/${itemId}`);
    expect(res.status).toBe(404);
  });

  it("moves review → published as the archivist", async () => {
    const res = await request(app)
      .patch(`/api/archive/${itemId}/status`)
      .set("Authorization", `Bearer ${tokenFor(archivistId, "archivist")}`)
      .send({ status: "published" });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe("published");
  });

  it("surfaces the published item in public (unauthenticated) search", async () => {
    const res = await request(app).get("/api/archive/search").query({ query: uniqueTitle });
    expect(res.status).toBe(200);
    const titles = (res.body.data.items as { title_en: string }[]).map((i) => i.title_en);
    expect(titles).toContain(uniqueTitle);
  });

  it("a guest can now fetch the published item directly", async () => {
    const res = await request(app).get(`/api/archive/${itemId}`);
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe("published");
  });

  it("logged a STATUS_CHANGE audit entry for each transition", async () => {
    const logs = await pool.query(
      "SELECT details FROM audit_logs WHERE entity_id = $1 AND action = 'STATUS_CHANGE' ORDER BY timestamp ASC",
      [itemId]
    );
    expect(logs.rows.length).toBe(2);
    expect(logs.rows[0].details).toMatchObject({ from: "draft", to: "review" });
    expect(logs.rows[1].details).toMatchObject({ from: "review", to: "published" });
  });
});
