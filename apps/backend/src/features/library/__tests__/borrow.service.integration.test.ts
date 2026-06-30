import { Pool } from "pg";
import { BorrowService } from "../borrow.service";

// Runs against the disposable test database (docker-compose.test.yml), never
// the shared Supabase dev database. This exercises the exact schema the
// production lending workflow was silently broken against for weeks
// (the "borrows" table didn't exist on the live DB — see migration 008) —
// a real DB round-trip here would have caught that before it shipped.
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

let userId: string;
let catalogId: string;

beforeAll(async () => {
  const user = await pool.query(
    `INSERT INTO users (name, email, password_hash, role)
     VALUES ('Test Borrower', 'borrower-it@test.local', 'x', 'member')
     RETURNING user_id`
  );
  userId = user.rows[0].user_id;

  const catalogItem = await pool.query(
    `INSERT INTO catalog_items (title, category, total_copies, available_copies)
     VALUES ('Integration Test Book', 'Test', 1, 1)
     RETURNING catalog_id`
  );
  catalogId = catalogItem.rows[0].catalog_id;
});

afterAll(async () => {
  // Best-effort cleanup — this is a disposable tmpfs test database (reset via
  // `docker compose -f docker-compose.test.yml restart`), so a partial
  // failure here shouldn't fail the suite.
  const cleanupQueries = [
    "DELETE FROM fines WHERE member_id = $1",
    "DELETE FROM notifications WHERE user_id = $1",
    "DELETE FROM audit_logs WHERE user_id = $1",
    "DELETE FROM borrows WHERE user_id = $1",
  ];
  for (const sql of cleanupQueries) {
    await pool.query(sql, [userId]).catch(() => {});
  }
  await pool.query("DELETE FROM catalog_items WHERE catalog_id = $1", [catalogId]).catch(() => {});
  await pool.query("DELETE FROM users WHERE user_id = $1", [userId]).catch(() => {});
  await pool.end();
});

describe("BorrowService against a real database", () => {
  it("issues a book, decrements available_copies, and records the borrow", async () => {
    const { borrow, item } = await BorrowService.issueResource(catalogId, userId, userId, "127.0.0.1");

    expect(borrow.user_id).toBe(userId);
    expect(borrow.resource_id).toBe(catalogId);
    expect(borrow.borrow_status).toBe("active");
    expect(item.available_copies).toBe(1); // pre-decrement snapshot returned by the query

    const updated = await pool.query(
      "SELECT available_copies FROM catalog_items WHERE catalog_id = $1",
      [catalogId]
    );
    expect(updated.rows[0].available_copies).toBe(0);
  });

  it("rejects issuing a copy that has none available", async () => {
    await expect(
      BorrowService.issueResource(catalogId, userId, userId, "127.0.0.1")
    ).rejects.toThrow(/no copies available/i);
  });

  it("returns the book and increments available_copies again", async () => {
    const [{ id: borrowId }] = await pool.query<{ id: string }>(
      "SELECT id FROM borrows WHERE resource_id = $1 AND user_id = $2 AND borrow_status = 'active'",
      [catalogId, userId]
    ).then((r) => r.rows);

    const result = await BorrowService.returnResource(borrowId);
    expect(result.borrow.borrow_status).toBe("returned");
    expect(result.fine_amount).toBe(0);

    const updated = await pool.query(
      "SELECT available_copies FROM catalog_items WHERE catalog_id = $1",
      [catalogId]
    );
    expect(updated.rows[0].available_copies).toBe(1);
  });
});
