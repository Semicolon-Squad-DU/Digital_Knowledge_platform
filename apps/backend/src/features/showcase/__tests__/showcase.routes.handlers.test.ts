import express from "express";
import request from "supertest";
import jwt from "jsonwebtoken";

jest.mock("../../../core/db/pool", () => ({
  query: jest.fn(),
  queryOne: jest.fn(),
}));
jest.mock("../../../infrastructure/s3.service", () => ({
  uploadToS3: jest.fn(),
  generateS3Key: jest.fn(),
  getPresignedUrl: jest.fn(),
}));
jest.mock("../../../infrastructure/email.service", () => ({
  sendEmail: jest.fn().mockResolvedValue(undefined),
  projectApprovalEmail: jest.fn(),
}));

import { query, queryOne } from "../../../core/db/pool";
import showcaseRoutes from "../showcase.routes";
import { errorHandler, notFound } from "../../../core/middleware/error.middleware";

const mockedQuery = query as jest.Mock;
const mockedQueryOne = queryOne as jest.Mock;

const app = express();
app.use(express.json());
app.use("/api/showcase", showcaseRoutes);
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
  mockedQuery.mockResolvedValue([]);
});

describe("POST /api/showcase", () => {
  it("rejects a submission missing required fields", async () => {
    mockActiveSession();
    const res = await request(app)
      .post("/api/showcase")
      .set("Authorization", `Bearer ${tokenFor("u1", "student_author")}`)
      .field("title", "My Project");
    expect(res.status).toBe(400);
  });
});

describe("PATCH /api/showcase/:id/review", () => {
  it("rejects an invalid review action", async () => {
    mockActiveSession();
    const res = await request(app)
      .patch("/api/showcase/p1/review")
      .set("Authorization", `Bearer ${tokenFor("u1", "researcher")}`)
      .send({ action: "reject_forever" });
    expect(res.status).toBe(400);
  });

  it("404s when the project doesn't exist", async () => {
    mockActiveSession();
    mockedQueryOne.mockResolvedValueOnce(null);
    const res = await request(app)
      .patch("/api/showcase/missing/review")
      .set("Authorization", `Bearer ${tokenFor("u1", "researcher")}`)
      .send({ action: "approve" });
    expect(res.status).toBe(404);
  });

  it("blocks an advisor who isn't assigned to this project", async () => {
    mockActiveSession();
    mockedQueryOne.mockResolvedValueOnce({
      project_id: "p1", title: "X", advisor_id: "someone-else", submitted_by: "s1", status: "pending_review",
    });
    const res = await request(app)
      .patch("/api/showcase/p1/review")
      .set("Authorization", `Bearer ${tokenFor("u1", "researcher")}`)
      .send({ action: "approve" });
    expect(res.status).toBe(403);
  });
});

describe("PATCH /api/showcase/:id", () => {
  it("rejects an edit with a blank title", async () => {
    mockActiveSession();
    const res = await request(app)
      .patch("/api/showcase/p1")
      .set("Authorization", `Bearer ${tokenFor("u1", "student_author")}`)
      .field("title", "");
    expect(res.status).toBe(400);
  });

  it("404s when the project doesn't exist", async () => {
    mockActiveSession();
    mockedQueryOne.mockResolvedValueOnce(null);
    const res = await request(app)
      .patch("/api/showcase/missing")
      .set("Authorization", `Bearer ${tokenFor("u1", "student_author")}`)
      .field("title", "New Title");
    expect(res.status).toBe(404);
  });
});
