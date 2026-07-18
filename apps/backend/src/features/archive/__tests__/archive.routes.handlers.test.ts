import express from "express";
import request from "supertest";
import jwt from "jsonwebtoken";

jest.mock("../../../core/db/pool", () => ({
  query: jest.fn(),
  queryOne: jest.fn(),
  withTransaction: jest.fn(),
}));
jest.mock("../../../infrastructure/s3.service", () => ({
  uploadToS3: jest.fn(),
  getPresignedUrl: jest.fn(),
  generateS3Key: jest.fn(),
  deleteFromS3: jest.fn(),
  fileExistsInS3: jest.fn(),
}));
jest.mock("../../../infrastructure/elasticsearch.service", () => ({
  indexArchiveItem: jest.fn().mockResolvedValue(undefined),
  searchArchive: jest.fn(),
  removeArchiveItemFromIndex: jest.fn().mockResolvedValue(undefined),
}));
jest.mock("../archive-create.service", () => ({
  createArchiveItemRecord: jest.fn(),
}));

import { query, queryOne } from "../../../core/db/pool";
import { getPresignedUrl } from "../../../infrastructure/s3.service";
import { searchArchive } from "../../../infrastructure/elasticsearch.service";
import archiveRoutes from "../archive.routes";
import { errorHandler, notFound } from "../../../core/middleware/error.middleware";

const mockedQuery = query as jest.Mock;
const mockedQueryOne = queryOne as jest.Mock;
const mockedGetPresignedUrl = getPresignedUrl as jest.Mock;
const mockedSearchArchive = searchArchive as jest.Mock;

const app = express();
app.use(express.json());
app.use("/api/archive", archiveRoutes);
app.use(notFound);
app.use(errorHandler);

function tokenFor(user_id: string, role: string): string {
  return jwt.sign({ user_id, email: `${role}@test.local`, role }, process.env.JWT_SECRET as string, {
    expiresIn: "15m",
  });
}

function mockActiveSession() {
  mockedQueryOne.mockResolvedValueOnce({ membership_status: "active", is_idle: false });
}

beforeEach(() => {
  mockedQuery.mockReset();
  mockedQueryOne.mockReset();
  mockedGetPresignedUrl.mockReset();
  mockedSearchArchive.mockReset();
  mockedQuery.mockResolvedValue([]);
});

describe("GET /api/archive/meta/tags", () => {
  it("returns the list of tags with no authentication required", async () => {
    mockedQuery.mockResolvedValueOnce([{ tag_id: "t1", name_en: "AI" }]);

    const res = await request(app).get("/api/archive/meta/tags");

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([{ tag_id: "t1", name_en: "AI" }]);
  });
});

describe("GET /api/archive/search", () => {
  it("returns paginated search results for a guest, without a token", async () => {
    mockedSearchArchive.mockResolvedValueOnce({ hits: [{ item_id: "a1" }], total: 1 });

    const res = await request(app).get("/api/archive/search").query({ page: "1", limit: "20" });

    expect(res.status).toBe(200);
    expect(res.body.data.items).toHaveLength(1);
    expect(res.body.data.total_pages).toBe(1);
  });

  it("passes the guest's allowed tiers (public only) through to searchArchive", async () => {
    mockedSearchArchive.mockResolvedValueOnce({ hits: [], total: 0 });

    await request(app).get("/api/archive/search");

    expect(mockedSearchArchive).toHaveBeenCalledWith(
      expect.objectContaining({ allowed_tiers: expect.arrayContaining(["public"]) })
    );
  });
});

describe("GET /api/archive/download-url", () => {
  it("rejects an unauthenticated request", async () => {
    const res = await request(app).get("/api/archive/download-url").query({ key: "archive/x.pdf" });
    expect(res.status).toBe(401);
  });

  it("rejects a request with no key", async () => {
    mockActiveSession();
    const res = await request(app)
      .get("/api/archive/download-url")
      .set("Authorization", `Bearer ${tokenFor("u1", "member")}`);
    expect(res.status).toBe(400);
  });

  it("404s when no archive item matches the given key", async () => {
    mockActiveSession();
    mockedQueryOne.mockResolvedValueOnce(null);

    const res = await request(app)
      .get("/api/archive/download-url")
      .query({ key: "archive/missing.pdf" })
      .set("Authorization", `Bearer ${tokenFor("u1", "member")}`);

    expect(res.status).toBe(404);
  });

  it("blocks a member from a restricted-tier file with no approved access request", async () => {
    mockActiveSession();
    mockedQueryOne
      .mockResolvedValueOnce({ item_id: "a1", access_tier: "restricted" })
      .mockResolvedValueOnce(null); // no access request on file

    const res = await request(app)
      .get("/api/archive/download-url")
      .query({ key: "archive/restricted.pdf" })
      .set("Authorization", `Bearer ${tokenFor("u1", "member")}`);

    expect(res.status).toBe(403);
  });

  it("allows a member with an approved access request through to a restricted file", async () => {
    mockActiveSession();
    mockedQueryOne
      .mockResolvedValueOnce({ item_id: "a1", access_tier: "restricted" })
      .mockResolvedValueOnce({ status: "approved" });
    mockedGetPresignedUrl.mockResolvedValueOnce("https://signed.example/url");

    const res = await request(app)
      .get("/api/archive/download-url")
      .query({ key: "archive/restricted.pdf" })
      .set("Authorization", `Bearer ${tokenFor("u1", "member")}`);

    expect(res.status).toBe(200);
    expect(res.body.data.url).toBe("https://signed.example/url");
  });

  it("allows an archivist straight through to a restricted file with no access request needed", async () => {
    mockActiveSession();
    mockedQueryOne.mockResolvedValueOnce({ item_id: "a1", access_tier: "restricted" });
    mockedGetPresignedUrl.mockResolvedValueOnce("https://signed.example/url");

    const res = await request(app)
      .get("/api/archive/download-url")
      .query({ key: "archive/restricted.pdf" })
      .set("Authorization", `Bearer ${tokenFor("u1", "archivist")}`);

    expect(res.status).toBe(200);
  });
});

describe("PATCH /api/archive/:id/status", () => {
  it("rejects an unauthenticated request", async () => {
    const res = await request(app).patch("/api/archive/a1/status").send({ status: "published" });
    expect(res.status).toBe(401);
  });

  it("rejects a role with no status-change permission (member)", async () => {
    mockActiveSession();
    const res = await request(app)
      .patch("/api/archive/a1/status")
      .set("Authorization", `Bearer ${tokenFor("u1", "member")}`)
      .send({ status: "published" });
    expect(res.status).toBe(403);
  });

  it("rejects an invalid status value", async () => {
    mockActiveSession();
    const res = await request(app)
      .patch("/api/archive/a1/status")
      .set("Authorization", `Bearer ${tokenFor("u1", "archivist")}`)
      .send({ status: "not-a-real-status" });
    expect(res.status).toBe(400);
  });

  it("404s when the archive item doesn't exist", async () => {
    mockActiveSession();
    mockedQueryOne.mockResolvedValueOnce(null);
    const res = await request(app)
      .patch("/api/archive/missing/status")
      .set("Authorization", `Bearer ${tokenFor("u1", "archivist")}`)
      .send({ status: "published" });
    expect(res.status).toBe(404);
  });

  it("rejects an invalid lifecycle jump (draft -> archived)", async () => {
    mockActiveSession();
    mockedQueryOne.mockResolvedValueOnce({ item_id: "a1", status: "draft", file_url: "x", version: 1 });
    const res = await request(app)
      .patch("/api/archive/a1/status")
      .set("Authorization", `Bearer ${tokenFor("u1", "archivist")}`)
      .send({ status: "archived" });
    expect(res.status).toBe(409);
  });

  it("blocks a librarian from moving a published item backward to review (regression)", async () => {
    mockActiveSession();
    mockedQueryOne.mockResolvedValueOnce({ item_id: "a1", status: "published", file_url: "x", version: 1 });
    const res = await request(app)
      .patch("/api/archive/a1/status")
      .set("Authorization", `Bearer ${tokenFor("u1", "librarian")}`)
      .send({ status: "review" });
    expect(res.status).toBe(403);
  });

  it("allows an archivist to move a published item backward to review (regression allowed for archivist)", async () => {
    mockActiveSession();
    mockedQueryOne
      .mockResolvedValueOnce({ item_id: "a1", status: "published", file_url: "x", version: 1 })
      .mockResolvedValueOnce({ item_id: "a1", status: "review" });
    const res = await request(app)
      .patch("/api/archive/a1/status")
      .set("Authorization", `Bearer ${tokenFor("u1", "archivist")}`)
      .send({ status: "review" });
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe("review");
  });

  it("allows the normal forward transition draft -> review", async () => {
    mockActiveSession();
    mockedQueryOne
      .mockResolvedValueOnce({ item_id: "a1", status: "draft", file_url: "x", version: 1 })
      .mockResolvedValueOnce({ item_id: "a1", status: "review" });
    const res = await request(app)
      .patch("/api/archive/a1/status")
      .set("Authorization", `Bearer ${tokenFor("u1", "librarian")}`)
      .send({ status: "review" });
    expect(res.status).toBe(200);
  });
});

describe("Zod validation on archive body-taking routes", () => {
  it("rejects POST /:id/access-request with a blank reason", async () => {
    mockActiveSession();
    const res = await request(app)
      .post("/api/archive/a1/access-request")
      .set("Authorization", `Bearer ${tokenFor("u1", "member")}`)
      .send({ reason: "   " });
    expect(res.status).toBe(400);
  });

  it("accepts POST /:id/access-request with a real reason", async () => {
    mockActiveSession();
    mockedQueryOne
      .mockResolvedValueOnce({ item_id: "a1", access_tier: "restricted", title_en: "Doc" })
      .mockResolvedValueOnce(null) // no existing pending request
      .mockResolvedValueOnce({ request_id: "r1" })
      .mockResolvedValueOnce({ name: "Jane" });
    const res = await request(app)
      .post("/api/archive/a1/access-request")
      .set("Authorization", `Bearer ${tokenFor("u1", "member")}`)
      .send({ reason: "Needed for my thesis" });
    expect(res.status).toBe(201);
  });

  it("rejects PATCH /access-requests/:id/review with an invalid status", async () => {
    mockActiveSession();
    const res = await request(app)
      .patch("/api/archive/access-requests/r1/review")
      .set("Authorization", `Bearer ${tokenFor("u1", "archivist")}`)
      .send({ status: "sure-why-not" });
    expect(res.status).toBe(400);
  });

  // NOTE: PATCH /bulk-metadata is registered after PATCH /:id in
  // archive.routes.ts, so Express matches it as PATCH /:id with id="bulk-metadata"
  // instead — a pre-existing route-ordering bug, not something introduced by
  // Zod validation. This test documents current (broken) behavior rather than
  // the intended one; it should be revisited when that ordering bug is fixed.
  it("currently 404s on PATCH /bulk-metadata — shadowed by PATCH /:id (pre-existing route-order bug)", async () => {
    mockActiveSession();
    mockedQueryOne.mockResolvedValueOnce(null); // PATCH /:id's item lookup, id="bulk-metadata"
    const res = await request(app)
      .patch("/api/archive/bulk-metadata")
      .set("Authorization", `Bearer ${tokenFor("u1", "archivist")}`)
      .send({ ids: [] });
    expect(res.status).toBe(404);
  });

  it("rejects POST /upload/finalize missing file_key/file_type/file_size", async () => {
    mockActiveSession();
    const res = await request(app)
      .post("/api/archive/upload/finalize")
      .set("Authorization", `Bearer ${tokenFor("u1", "archivist")}`)
      .send({ title_en: "A Document" });
    expect(res.status).toBe(400);
  });

  it("rejects POST /upload/finalize with a blank title_en", async () => {
    mockActiveSession();
    const res = await request(app)
      .post("/api/archive/upload/finalize")
      .set("Authorization", `Bearer ${tokenFor("u1", "archivist")}`)
      .send({ title_en: "  ", file_key: "k", file_type: "application/pdf", file_size: "1024" });
    expect(res.status).toBe(400);
  });
});
