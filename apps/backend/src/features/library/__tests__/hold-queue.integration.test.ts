import express from "express";
import request from "supertest";
import jwt from "jsonwebtoken";
import { Pool } from "pg";
import libraryRoutes from "../library.routes";
import { errorHandler, notFound } from "../../../core/middleware/error.middleware";

/**
 * SDD §7 E2E target TC-TXX-017: a member places a hold on a book whose only
 * copy is on loan; when it's returned, the hold flips to "available" and the
 * waiting member gets a notification.
 */
const app = express();
app.use(express.json());
app.use("/api/library", libraryRoutes);
app.use(notFound);
app.use(errorHandler);

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

function tokenFor(user_id: string, role: string): string {
  return jwt.sign({ user_id, email: `${role}@test.local`, role }, process.env.JWT_SECRET as string, {
    expiresIn: "15m",
  });
}

let librarianId: string;
let borrowerId: string;
let waiterId: string;
let catalogId: string;
let borrowId: string;

beforeAll(async () => {
  const librarian = await pool.query(
    `INSERT INTO users (name, email, password_hash, role, membership_status)
     VALUES ('Test Librarian Hold E2E', 'librarian-hold-it@test.local', 'x', 'librarian', 'active')
     RETURNING user_id`
  );
  librarianId = librarian.rows[0].user_id;

  const borrower = await pool.query(
    `INSERT INTO users (name, email, password_hash, role, membership_status)
     VALUES ('Test Borrower Hold E2E', 'borrower-hold-it@test.local', 'x', 'member', 'active')
     RETURNING user_id`
  );
  borrowerId = borrower.rows[0].user_id;

  const waiter = await pool.query(
    `INSERT INTO users (name, email, password_hash, role, membership_status)
     VALUES ('Test Waiter Hold E2E', 'waiter-hold-it@test.local', 'x', 'member', 'active')
     RETURNING user_id`
  );
  waiterId = waiter.rows[0].user_id;

  const catalogItem = await pool.query(
    `INSERT INTO catalog_items (title, category, total_copies, available_copies)
     VALUES ('E2E Hold Queue Test Book', 'Test', 1, 1)
     RETURNING catalog_id`
  );
  catalogId = catalogItem.rows[0].catalog_id;
});

afterAll(async () => {
  const allUserIds = [librarianId, borrowerId, waiterId];
  await pool.query("DELETE FROM notifications WHERE user_id = ANY($1)", [allUserIds]).catch(() => {});
  await pool.query("DELETE FROM audit_logs WHERE user_id = ANY($1)", [allUserIds]).catch(() => {});
  await pool.query("DELETE FROM hold_requests WHERE catalog_id = $1", [catalogId]).catch(() => {});
  await pool.query("DELETE FROM borrows WHERE resource_id = $1", [catalogId]).catch(() => {});
  await pool.query("DELETE FROM catalog_items WHERE catalog_id = $1", [catalogId]).catch(() => {});
  await pool.query("DELETE FROM users WHERE user_id = ANY($1)", [allUserIds]).catch(() => {});
  await pool.end();
});

describe("Hold queue: place hold on fully-loaned item → return → notified (TC-TXX-017)", () => {
  it("takes the only copy so the item has zero availability", async () => {
    const res = await request(app)
      .post("/api/library/issue")
      .set("Authorization", `Bearer ${tokenFor(librarianId, "librarian")}`)
      .send({ catalog_id: catalogId, member_id: borrowerId });

    expect(res.status).toBe(201);
    borrowId = res.body.data.transaction_id;
  });

  it("lets the waiting member place a hold at queue position 1", async () => {
    const res = await request(app)
      .post("/api/library/holds")
      .set("Authorization", `Bearer ${tokenFor(waiterId, "member")}`)
      .send({ catalog_id: catalogId });

    expect(res.status).toBe(201);
    expect(res.body.data.status).toBe("pending");
    expect(res.body.data.queue_position).toBe(1);
  });

  it("flips the hold to available and notifies the waiter when the book is returned", async () => {
    const res = await request(app)
      .post("/api/library/return")
      .set("Authorization", `Bearer ${tokenFor(librarianId, "librarian")}`)
      .send({ transaction_id: borrowId });

    expect(res.status).toBe(200);

    const holds = await request(app)
      .get(`/api/library/member/${waiterId}/holds`)
      .set("Authorization", `Bearer ${tokenFor(waiterId, "member")}`);

    expect(holds.status).toBe(200);
    expect(holds.body.data[0].status).toBe("available");

    const notifications = await pool.query(
      "SELECT * FROM notifications WHERE user_id = $1 AND type = 'hold_available'",
      [waiterId]
    );
    expect(notifications.rows.length).toBeGreaterThan(0);
  });
});
