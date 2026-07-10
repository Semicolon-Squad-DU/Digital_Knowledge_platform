import express from "express";
import request from "supertest";
import jwt from "jsonwebtoken";
import { Pool } from "pg";
import libraryRoutes from "../library.routes";
import { errorHandler, notFound } from "../../../core/middleware/error.middleware";

/**
 * SDD §7 E2E targets:
 *  - TC-TXX-013: librarian scans a barcode, enters a member ID, confirms
 *    issue — member's history shows the active borrow.
 *  - TC-TXX-014: librarian processes a return that's 3 days overdue — the
 *    system calculates a Tk 15 fine (3 days × Tk 5/day) and it appears on
 *    the member's account.
 */
const app = express();
app.use(express.json());
app.use("/api/library", libraryRoutes);
app.use(notFound);
app.use(errorHandler);

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

function tokenFor(user_id: string, role: string, email?: string): string {
  return jwt.sign({ user_id, email: email ?? `${role}@test.local`, role }, process.env.JWT_SECRET as string, {
    expiresIn: "15m",
  });
}

let librarianId: string;
let memberId: string;
let memberEmail: string;
let catalogId: string;
let borrowId: string;
const barcode = `E2E-BARCODE-${Date.now()}`;

beforeAll(async () => {
  const librarian = await pool.query(
    `INSERT INTO users (name, email, password_hash, role, membership_status)
     VALUES ('Test Librarian E2E', 'librarian-lending-it@test.local', 'x', 'librarian', 'active')
     RETURNING user_id`
  );
  librarianId = librarian.rows[0].user_id;

  memberEmail = `member-lending-it-${Date.now()}@test.local`;
  const member = await pool.query(
    `INSERT INTO users (name, email, password_hash, role, membership_status)
     VALUES ('Test Member E2E', $1, 'x', 'member', 'active')
     RETURNING user_id`,
    [memberEmail]
  );
  memberId = member.rows[0].user_id;

  const catalogItem = await pool.query(
    `INSERT INTO catalog_items (title, category, total_copies, available_copies, barcode)
     VALUES ('E2E Lending Test Book', 'Test', 1, 1, $1)
     RETURNING catalog_id`,
    [barcode]
  );
  catalogId = catalogItem.rows[0].catalog_id;
});

afterAll(async () => {
  const cleanup = [
    "DELETE FROM fines WHERE member_id = $1",
    "DELETE FROM notifications WHERE user_id = $1",
    "DELETE FROM audit_logs WHERE user_id = $1",
    "DELETE FROM borrows WHERE user_id = $1",
  ];
  for (const sql of cleanup) await pool.query(sql, [memberId]).catch(() => {});
  await pool.query("DELETE FROM catalog_items WHERE catalog_id = $1", [catalogId]).catch(() => {});
  await pool.query("DELETE FROM users WHERE user_id = ANY($1)", [[librarianId, memberId]]).catch(() => {});
  await pool.end();
});

describe("Lending workflow: issue by barcode → overdue return → fine (TC-TXX-013, TC-TXX-014)", () => {
  it("issues the book by scanned barcode + member email", async () => {
    const res = await request(app)
      .post("/api/library/issue")
      .set("Authorization", `Bearer ${tokenFor(librarianId, "librarian")}`)
      .send({ barcode, member_id: memberEmail });

    expect(res.status).toBe(201);
    expect(res.body.data.status).toBe("active");
    borrowId = res.body.data.transaction_id;

    const catalog = await pool.query("SELECT available_copies FROM catalog_items WHERE catalog_id = $1", [catalogId]);
    expect(catalog.rows[0].available_copies).toBe(0);
  });

  it("shows the active borrow on the member's own history", async () => {
    const res = await request(app)
      .get(`/api/library/member/${memberId}/history`)
      .set("Authorization", `Bearer ${tokenFor(memberId, "member", memberEmail)}`);

    expect(res.status).toBe(200);
    const active = (res.body.data as { transaction_id: string; status: string }[]).find(
      (t) => t.transaction_id === borrowId
    );
    expect(active).toBeDefined();
    expect(active?.status).toBe("active");
  });

  it("calculates a Tk 15 fine when returned 3 days overdue", async () => {
    // Backdate both issue_date and due_date to simulate 3 days overdue without waiting
    // 3 real days — due_date must stay > issue_date per the borrows_check constraint.
    await pool.query(
      `UPDATE borrows
       SET issue_date = CURRENT_DATE - INTERVAL '17 days',
           due_date = CURRENT_DATE - INTERVAL '3 days',
           borrow_status = 'overdue'
       WHERE id = $1`,
      [borrowId]
    );

    const res = await request(app)
      .post("/api/library/return")
      .set("Authorization", `Bearer ${tokenFor(librarianId, "librarian")}`)
      .send({ barcode, member_id: memberEmail });

    expect(res.status).toBe(200);
    expect(res.body.data.fine_amount).toBe(15);
    expect(res.body.data.transaction.status).toBe("returned");

    const catalog = await pool.query("SELECT available_copies FROM catalog_items WHERE catalog_id = $1", [catalogId]);
    expect(catalog.rows[0].available_copies).toBe(1);
  });

  it("shows the Tk 15 fine on the member's account", async () => {
    const res = await request(app)
      .get(`/api/library/fines/${memberId}`)
      .set("Authorization", `Bearer ${tokenFor(librarianId, "librarian")}`);

    expect(res.status).toBe(200);
    expect(res.body.data.total_pending).toBe(15);
    expect(res.body.data.fines.length).toBeGreaterThan(0);
    expect(parseFloat(res.body.data.fines[0].amount)).toBe(15);
  });
});
