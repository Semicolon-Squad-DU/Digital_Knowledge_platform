import express from "express";
import request from "supertest";
import jwt from "jsonwebtoken";
import { Pool } from "pg";
import archiveRoutes from "../archive.routes";
import { errorHandler, notFound } from "../../../core/middleware/error.middleware";

// Real Express app + real database, no mocks — exercises the exact
// access-tier regression covered by the unit-level matrix in
// core/__tests__/access-control.test.ts, but through the actual HTTP route
// and a real archive_items row.
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

let uploaderId: string;
let restrictedItemId: string;
const restrictedKey = "archive/integration-test-restricted.pdf";

beforeAll(async () => {
  const uploader = await pool.query(
    `INSERT INTO users (name, email, password_hash, role)
     VALUES ('Test Archivist', 'archivist-it@test.local', 'x', 'archivist')
     RETURNING user_id`
  );
  uploaderId = uploader.rows[0].user_id;

  const item = await pool.query(
    `INSERT INTO archive_items (title_en, category, access_tier, status, file_url, file_type, file_size, uploaded_by)
     VALUES ('Restricted Integration Test Doc', 'Test', 'restricted', 'published', $1, 'application/pdf', 1024, $2)
     RETURNING item_id`,
    [restrictedKey, uploaderId]
  );
  restrictedItemId = item.rows[0].item_id;
});

afterAll(async () => {
  await pool.query("DELETE FROM archive_items WHERE item_id = $1", [restrictedItemId]).catch(() => {});
  await pool.query("DELETE FROM audit_logs WHERE user_id = $1", [uploaderId]).catch(() => {});
  await pool.query("DELETE FROM users WHERE user_id = $1", [uploaderId]).catch(() => {});
  await pool.end();
});

describe("GET /api/archive/download-url — access-tier enforcement", () => {
  it("rejects a request with no auth token", async () => {
    const res = await request(app).get("/api/archive/download-url").query({ key: restrictedKey });
    expect(res.status).toBe(401);
  });

  it("rejects a member from a restricted-tier file", async () => {
    const res = await request(app)
      .get("/api/archive/download-url")
      .query({ key: restrictedKey })
      .set("Authorization", `Bearer ${tokenFor("11111111-1111-1111-1111-111111111111", "member")}`);

    expect(res.status).toBe(403);
  });

  it("allows an archivist to reach the same restricted-tier file", async () => {
    const res = await request(app)
      .get("/api/archive/download-url")
      .query({ key: restrictedKey })
      .set("Authorization", `Bearer ${tokenFor(uploaderId, "archivist")}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it("404s for a key that doesn't belong to any archive item", async () => {
    const res = await request(app)
      .get("/api/archive/download-url")
      .query({ key: "archive/does-not-exist.pdf" })
      .set("Authorization", `Bearer ${tokenFor(uploaderId, "archivist")}`);

    expect(res.status).toBe(404);
  });
});
