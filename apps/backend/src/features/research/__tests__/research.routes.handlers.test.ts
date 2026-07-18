import express from "express";
import request from "supertest";
import jwt from "jsonwebtoken";

jest.mock("../../../core/db/pool", () => ({
  query: jest.fn(),
  queryOne: jest.fn(),
}));
jest.mock("../../../infrastructure/s3.service", () => ({
  uploadToS3: jest.fn(),
  getPresignedUrl: jest.fn(),
  generateS3Key: jest.fn(),
}));
jest.mock("../../../infrastructure/elasticsearch.service", () => ({
  indexResearchOutput: jest.fn(),
  searchResearch: jest.fn(),
}));
jest.mock("../../../infrastructure/notification.service", () => ({
  notifyAllUsersExcept: jest.fn().mockResolvedValue(undefined),
}));

import { query, queryOne } from "../../../core/db/pool";
import researchRoutes from "../research.routes";
import { errorHandler, notFound } from "../../../core/middleware/error.middleware";

const mockedQuery = query as jest.Mock;
const mockedQueryOne = queryOne as jest.Mock;

const app = express();
app.use(express.json());
app.use("/api/research", researchRoutes);
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

describe("POST /api/research/labs", () => {
  it("rejects a request with a blank lab name", async () => {
    mockActiveSession();
    const res = await request(app)
      .post("/api/research/labs")
      .set("Authorization", `Bearer ${tokenFor("u1", "researcher")}`)
      .send({ name: "   " });
    expect(res.status).toBe(400);
  });

  it("creates a lab with a valid name", async () => {
    mockActiveSession();
    mockedQueryOne.mockResolvedValueOnce({ lab_id: "l1", name: "AI Lab" });
    const res = await request(app)
      .post("/api/research/labs")
      .set("Authorization", `Bearer ${tokenFor("u1", "researcher")}`)
      .send({ name: "AI Lab" });
    expect(res.status).toBe(201);
    expect(res.body.data.name).toBe("AI Lab");
  });
});

describe("PATCH /api/research/:id", () => {
  it("rejects an update with no fields at all if title is present but blank", async () => {
    mockActiveSession();
    const res = await request(app)
      .patch("/api/research/r1")
      .set("Authorization", `Bearer ${tokenFor("u1", "researcher")}`)
      .send({ title: "" });
    expect(res.status).toBe(400);
  });

  it("404s when the research output doesn't exist", async () => {
    mockActiveSession();
    mockedQueryOne.mockResolvedValueOnce(null);
    const res = await request(app)
      .patch("/api/research/missing")
      .set("Authorization", `Bearer ${tokenFor("u1", "researcher")}`)
      .send({ title: "New Title" });
    expect(res.status).toBe(404);
  });

  it("blocks a researcher from editing someone else's output", async () => {
    mockActiveSession();
    mockedQueryOne.mockResolvedValueOnce({ output_id: "r1", uploaded_by: "someone-else" });
    const res = await request(app)
      .patch("/api/research/r1")
      .set("Authorization", `Bearer ${tokenFor("u1", "researcher")}`)
      .send({ title: "New Title" });
    expect(res.status).toBe(403);
  });
});

describe("POST /api/research", () => {
  it("rejects a request with no title", async () => {
    mockActiveSession();
    const res = await request(app)
      .post("/api/research")
      .set("Authorization", `Bearer ${tokenFor("u1", "researcher")}`)
      .send({ abstract: "An abstract" });
    expect(res.status).toBe(400);
  });
});
