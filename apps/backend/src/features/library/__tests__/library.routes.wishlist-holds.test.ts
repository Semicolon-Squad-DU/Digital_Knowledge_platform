import express from "express";
import request from "supertest";
import jwt from "jsonwebtoken";

jest.mock("../../../core/db/pool", () => ({
  query: jest.fn(),
  queryOne: jest.fn(),
  withTransaction: jest.fn(),
}));
jest.mock("../../../infrastructure/elasticsearch.service", () => ({
  searchCatalog: jest.fn(),
  indexCatalogItem: jest.fn(),
  removeCatalogItemFromIndex: jest.fn(),
}));
jest.mock("../../../infrastructure/s3.service", () => ({
  uploadToS3: jest.fn(),
  getPresignedUrl: jest.fn(),
  generateS3Key: jest.fn(),
}));
jest.mock("../../../infrastructure/email.service", () => ({
  sendEmail: jest.fn().mockResolvedValue(undefined),
  dueDateReminderEmail: jest.fn(),
  holdAvailableEmail: jest.fn(),
  overdueFineReminderEmail: jest.fn(),
}));
jest.mock("../../../infrastructure/notification.service", () => ({
  notifyAllUsersExcept: jest.fn().mockResolvedValue(undefined),
}));
jest.mock("../borrow.service", () => ({
  BorrowService: { issueResource: jest.fn() },
}));

import { query, queryOne } from "../../../core/db/pool";
import libraryRoutes from "../library.routes";
import { errorHandler, notFound } from "../../../core/middleware/error.middleware";

const mockedQuery = query as jest.Mock;
const mockedQueryOne = queryOne as jest.Mock;

const app = express();
app.use(express.json());
app.use("/api/library", libraryRoutes);
app.use(notFound);
app.use(errorHandler);

function tokenFor(user_id: string, role: string): string {
  return jwt.sign({ user_id, email: `${role}@test.local`, role }, process.env.JWT_SECRET as string, {
    expiresIn: "15m",
  });
}

// checkAccountActiveAndFresh (auth.middleware) always issues one queryOne call
// first for every authenticated request — tests push their route-specific
// mock resolutions after this.
function mockActiveSession() {
  mockedQueryOne.mockResolvedValueOnce({ membership_status: "active", is_idle: false });
}

beforeEach(() => {
  mockedQuery.mockReset();
  mockedQueryOne.mockReset();
  mockedQuery.mockResolvedValue([]);
});

describe("GET /api/library/wishlist", () => {
  it("rejects an unauthenticated request", async () => {
    const res = await request(app).get("/api/library/wishlist");
    expect(res.status).toBe(401);
  });

  it("returns the caller's wishlist items", async () => {
    mockActiveSession();
    // See the holds test below for why this matches on query text rather
    // than call order: auth.middleware's fire-and-forget last_active_at
    // update also goes through query() and races with this one.
    mockedQuery.mockImplementation((text: string) =>
      text.includes("FROM wishlists")
        ? Promise.resolve([{ wishlist_id: "w1", catalog_id: "c1", title: "Book A" }])
        : Promise.resolve([])
    );

    const res = await request(app)
      .get("/api/library/wishlist")
      .set("Authorization", `Bearer ${tokenFor("u1", "member")}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].title).toBe("Book A");
  });
});

describe("POST /api/library/wishlist", () => {
  it("adds a catalog item to the caller's wishlist", async () => {
    mockActiveSession();
    mockedQueryOne.mockResolvedValueOnce({ wishlist_id: "w1", member_id: "u1", catalog_id: "c1" });

    const res = await request(app)
      .post("/api/library/wishlist")
      .set("Authorization", `Bearer ${tokenFor("u1", "member")}`)
      .send({ catalog_id: "c1" });

    expect(res.status).toBe(201);
    expect(res.body.data.catalog_id).toBe("c1");
  });
});

describe("DELETE /api/library/wishlist/:catalog_id", () => {
  it("removes the item and reports success", async () => {
    mockActiveSession();

    const res = await request(app)
      .delete("/api/library/wishlist/c1")
      .set("Authorization", `Bearer ${tokenFor("u1", "member")}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});

describe("POST /api/library/holds", () => {
  it("rejects a request with no catalog_id", async () => {
    mockActiveSession();

    const res = await request(app)
      .post("/api/library/holds")
      .set("Authorization", `Bearer ${tokenFor("u1", "member")}`)
      .send({});

    expect(res.status).toBe(400);
  });

  it("rejects a duplicate hold on the same item by the same member", async () => {
    mockActiveSession();
    mockedQueryOne.mockResolvedValueOnce({ hold_id: "h-existing" });

    const res = await request(app)
      .post("/api/library/holds")
      .set("Authorization", `Bearer ${tokenFor("u1", "member")}`)
      .send({ catalog_id: "c1" });

    expect(res.status).toBe(409);
  });

  it("places a new hold and reports the queue position", async () => {
    mockActiveSession();
    mockedQueryOne
      .mockResolvedValueOnce(null) // no existing hold
      .mockResolvedValueOnce({ hold_id: "h1", catalog_id: "c1", member_id: "u1", status: "pending" });
    // auth.middleware's checkAccountActiveAndFresh fires a non-awaited
    // "UPDATE last_active_at" via query() in the background, racing with the
    // route's own COUNT(*) query() call — match on query text instead of
    // relying on call order, since that race isn't deterministic.
    mockedQuery.mockImplementation((text: string) =>
      text.includes("COUNT(*)") ? Promise.resolve([{ count: "3" }]) : Promise.resolve([])
    );

    const res = await request(app)
      .post("/api/library/holds")
      .set("Authorization", `Bearer ${tokenFor("u1", "member")}`)
      .send({ catalog_id: "c1" });

    expect(res.status).toBe(201);
    expect(res.body.data.queue_position).toBe(3);
  });
});

describe("DELETE /api/library/holds/:id", () => {
  it("404s for a hold that doesn't exist", async () => {
    mockActiveSession();
    mockedQueryOne.mockResolvedValueOnce(null);

    const res = await request(app)
      .delete("/api/library/holds/h1")
      .set("Authorization", `Bearer ${tokenFor("u1", "member")}`);

    expect(res.status).toBe(404);
  });

  it("blocks a member from cancelling another member's hold", async () => {
    mockActiveSession();
    mockedQueryOne.mockResolvedValueOnce({ hold_id: "h1", member_id: "someone-else", status: "pending" });

    const res = await request(app)
      .delete("/api/library/holds/h1")
      .set("Authorization", `Bearer ${tokenFor("u1", "member")}`);

    expect(res.status).toBe(403);
  });

  it("allows the owning member to cancel their own pending hold", async () => {
    mockActiveSession();
    mockedQueryOne.mockResolvedValueOnce({ hold_id: "h1", member_id: "u1", status: "pending" });

    const res = await request(app)
      .delete("/api/library/holds/h1")
      .set("Authorization", `Bearer ${tokenFor("u1", "member")}`);

    expect(res.status).toBe(200);
  });

  it("blocks cancelling a hold that has already been fulfilled", async () => {
    mockActiveSession();
    mockedQueryOne.mockResolvedValueOnce({ hold_id: "h1", member_id: "u1", status: "fulfilled" });

    const res = await request(app)
      .delete("/api/library/holds/h1")
      .set("Authorization", `Bearer ${tokenFor("u1", "member")}`);

    expect(res.status).toBe(409);
  });
});

describe("Zod validation on library body-taking routes", () => {
  it("rejects POST /wishlist with a non-string catalog_id", async () => {
    mockActiveSession();
    const res = await request(app)
      .post("/api/library/wishlist")
      .set("Authorization", `Bearer ${tokenFor("u1", "member")}`)
      .send({ catalog_id: 12345 });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it("rejects POST /renew with a missing transaction_id", async () => {
    mockActiveSession();
    const res = await request(app)
      .post("/api/library/renew")
      .set("Authorization", `Bearer ${tokenFor("u1", "member")}`)
      .send({});
    expect(res.status).toBe(400);
  });

  it("rejects PATCH /fines/:id/adjust with a zero amount", async () => {
    mockActiveSession();
    const res = await request(app)
      .patch("/api/library/fines/f1/adjust")
      .set("Authorization", `Bearer ${tokenFor("u1", "librarian")}`)
      .send({ amount: 0, reason: "test" });
    expect(res.status).toBe(400);
  });

  it("rejects PATCH /fines/:id/adjust with a blank reason", async () => {
    mockActiveSession();
    const res = await request(app)
      .patch("/api/library/fines/f1/adjust")
      .set("Authorization", `Bearer ${tokenFor("u1", "librarian")}`)
      .send({ amount: 5, reason: "   " });
    expect(res.status).toBe(400);
  });

  it("accepts PATCH /fines/:id/adjust with a valid amount and reason", async () => {
    mockActiveSession();
    mockedQueryOne.mockResolvedValueOnce({ fine_id: "f1", amount: 5, reason: "Damaged cover" });
    const res = await request(app)
      .patch("/api/library/fines/f1/adjust")
      .set("Authorization", `Bearer ${tokenFor("u1", "librarian")}`)
      .send({ amount: 5, reason: "Damaged cover" });
    expect(res.status).toBe(200);
  });

  it("rejects POST /issue with neither catalog_id nor barcode", async () => {
    mockActiveSession();
    const res = await request(app)
      .post("/api/library/issue")
      .set("Authorization", `Bearer ${tokenFor("u1", "librarian")}`)
      .send({ member_id: "u2" });
    expect(res.status).toBe(400);
  });

  it("rejects PATCH /catalog/access-requests/:id/review with an invalid status", async () => {
    mockActiveSession();
    const res = await request(app)
      .patch("/api/library/catalog/access-requests/r1/review")
      .set("Authorization", `Bearer ${tokenFor("u1", "librarian")}`)
      .send({ status: "maybe" });
    expect(res.status).toBe(400);
  });

  it("rejects POST /catalog/import/commit with an empty rows array", async () => {
    mockActiveSession();
    const res = await request(app)
      .post("/api/library/catalog/import/commit")
      .set("Authorization", `Bearer ${tokenFor("u1", "librarian")}`)
      .send({ rows: [] });
    expect(res.status).toBe(400);
  });
});
