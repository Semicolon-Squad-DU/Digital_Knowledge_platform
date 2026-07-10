import express from "express";
import request from "supertest";
import { Pool } from "pg";
import libraryRoutes from "../library.routes";
import { errorHandler, notFound } from "../../../core/middleware/error.middleware";

/**
 * SDD §7 E2E target TC-TXX-012: a public visitor (no login) searches the
 * catalog and sees availability. The "Borrow button hidden for guests" half
 * of this test case is a frontend concern (verified manually); the backend
 * contract this locks in is that catalog search never requires auth and
 * always returns the availability count guests need to see it.
 */
const app = express();
app.use(express.json());
app.use("/api/library", libraryRoutes);
app.use(notFound);
app.use(errorHandler);

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

let catalogId: string;
const uniqueTitle = `E2E Public Search Test Book ${Date.now()}`;

beforeAll(async () => {
  const catalogItem = await pool.query(
    `INSERT INTO catalog_items (title, category, total_copies, available_copies)
     VALUES ($1, 'Test', 3, 2)
     RETURNING catalog_id`,
    [uniqueTitle]
  );
  catalogId = catalogItem.rows[0].catalog_id;
});

afterAll(async () => {
  await pool.query("DELETE FROM catalog_items WHERE catalog_id = $1", [catalogId]).catch(() => {});
  await pool.end();
});

describe("Public catalog search — no auth required (TC-TXX-012)", () => {
  it("returns matching results with availability, with no Authorization header at all", async () => {
    const res = await request(app).get("/api/library/catalog/search").query({ query: uniqueTitle });

    expect(res.status).toBe(200);
    const item = (res.body.data.items as { catalog_id: string; available_copies: number }[]).find(
      (i) => i.catalog_id === catalogId
    );
    expect(item).toBeDefined();
    expect(item?.available_copies).toBe(2);
  });

  it("rejects an invalid/garbage Authorization header rather than 500ing (still degrades to guest access)", async () => {
    const res = await request(app)
      .get("/api/library/catalog/search")
      .query({ query: uniqueTitle })
      .set("Authorization", "Bearer not-a-real-token");

    // optionalAuth treats an invalid token as "no user", it must not crash the request
    expect(res.status).toBe(200);
  });

  it("fetching a single catalog item by id also requires no auth", async () => {
    const res = await request(app).get(`/api/library/catalog/${catalogId}`);
    expect(res.status).toBe(200);
    expect(res.body.data.catalog_id).toBe(catalogId);
  });
});
