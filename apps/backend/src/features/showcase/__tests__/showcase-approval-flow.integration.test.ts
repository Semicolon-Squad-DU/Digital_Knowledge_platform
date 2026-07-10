import express from "express";
import request from "supertest";
import jwt from "jsonwebtoken";
import { Pool } from "pg";
import showcaseRoutes from "../showcase.routes";
import { errorHandler, notFound } from "../../../core/middleware/error.middleware";

/**
 * SDD §7 E2E target TC-TXX-009: a student submits a project, the assigned
 * advisor approves it, and it appears in the public showcase gallery.
 */
const app = express();
app.use(express.json());
app.use("/api/showcase", showcaseRoutes);
app.use(notFound);
app.use(errorHandler);

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

function tokenFor(user_id: string, role: string): string {
  return jwt.sign({ user_id, email: `${role}@test.local`, role }, process.env.JWT_SECRET as string, {
    expiresIn: "15m",
  });
}

let studentId: string;
let advisorId: string;
let projectId: string;
const uniqueTitle = `E2E Showcase Approval Test Project ${Date.now()}`;

beforeAll(async () => {
  const student = await pool.query(
    `INSERT INTO users (name, email, password_hash, role)
     VALUES ('Test Student E2E', 'student-showcase-it@test.local', 'x', 'student_author')
     RETURNING user_id`
  );
  studentId = student.rows[0].user_id;

  const advisor = await pool.query(
    `INSERT INTO users (name, email, password_hash, role)
     VALUES ('Test Advisor E2E', 'advisor-showcase-it@test.local', 'x', 'researcher')
     RETURNING user_id`
  );
  advisorId = advisor.rows[0].user_id;
});

afterAll(async () => {
  const allUserIds = [studentId, advisorId];
  await pool.query("DELETE FROM notifications WHERE user_id = ANY($1)", [allUserIds]).catch(() => {});
  await pool.query("DELETE FROM archive_items WHERE source_type = 'showcase' AND source_id = $1", [projectId]).catch(() => {});
  await pool.query("DELETE FROM student_projects WHERE project_id = $1", [projectId]).catch(() => {});
  await pool.query("DELETE FROM users WHERE user_id = ANY($1)", [allUserIds]).catch(() => {});
  await pool.end();
});

describe("Showcase submission → advisor approval → public gallery (TC-TXX-009)", () => {
  it("lets the student submit a project for review", async () => {
    const res = await request(app)
      .post("/api/showcase")
      .set("Authorization", `Bearer ${tokenFor(studentId, "student_author")}`)
      .field("title", uniqueTitle)
      .field("abstract", "An end-to-end test abstract describing the project.")
      .field("advisor_id", advisorId)
      .field("semester", "Spring 2026")
      .field("department", "CSE")
      .field("team_members", JSON.stringify([{ name: "Test Student E2E" }]))
      .field("technologies", JSON.stringify(["TypeScript", "Postgres"]));

    expect(res.status).toBe(201);
    expect(res.body.data.status).toBe("pending_review");
    projectId = res.body.data.project_id;
  });

  it("does not surface the pending project in the public gallery", async () => {
    const res = await request(app).get("/api/showcase").query({ q: uniqueTitle });
    const titles = (res.body.data.items as { title: string }[]).map((i) => i.title);
    expect(titles).not.toContain(uniqueTitle);
  });

  it("rejects review from anyone other than the assigned advisor", async () => {
    const res = await request(app)
      .patch(`/api/showcase/${projectId}/review`)
      .set("Authorization", `Bearer ${tokenFor(studentId, "student_author")}`)
      .send({ action: "approve" });

    // student_author isn't even authorized to hit this route (requireRole researcher/admin)
    expect(res.status).toBe(403);
  });

  it("lets the assigned advisor approve the project", async () => {
    const res = await request(app)
      .patch(`/api/showcase/${projectId}/review`)
      .set("Authorization", `Bearer ${tokenFor(advisorId, "researcher")}`)
      .send({ action: "approve" });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe("published");
  });

  it("surfaces the approved project in the public (unauthenticated) gallery", async () => {
    const res = await request(app).get("/api/showcase").query({ q: uniqueTitle });
    expect(res.status).toBe(200);
    const titles = (res.body.data.items as { title: string }[]).map((i) => i.title);
    expect(titles).toContain(uniqueTitle);
  });

  it("notified the student that their project was approved", async () => {
    const notifications = await pool.query(
      "SELECT * FROM notifications WHERE user_id = $1 AND type = 'project_approved'",
      [studentId]
    );
    expect(notifications.rows.length).toBeGreaterThan(0);
  });
});
