import express from "express";
import request from "supertest";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

jest.mock("../../../core/db/pool", () => ({
  query: jest.fn(),
  queryOne: jest.fn(),
}));
jest.mock("../../../infrastructure/email.service", () => ({
  sendEmail: jest.fn().mockResolvedValue(undefined),
  verificationOtpEmail: jest.fn(() => "<html></html>"),
  accountApprovalEmail: jest.fn(() => "<html></html>"),
}));
jest.mock("../../../infrastructure/firebase-auth.service", () => ({
  verifyFirebaseIdToken: jest.fn(),
}));
jest.mock("../../../infrastructure/notification.service", () => ({
  notifyAdmins: jest.fn().mockResolvedValue(undefined),
}));

import { query, queryOne } from "../../../core/db/pool";
import authRoutes from "../auth.routes";
import { errorHandler, notFound } from "../../../core/middleware/error.middleware";

const mockedQuery = query as jest.Mock;
const mockedQueryOne = queryOne as jest.Mock;

const app = express();
app.use(express.json());
app.use("/api/auth", authRoutes);
app.use(notFound);
app.use(errorHandler);

function tokenFor(user_id: string, role: string): string {
  return jwt.sign({ user_id, email: `${role}@test.local`, role }, process.env.JWT_SECRET as string, {
    expiresIn: "15m",
  });
}

beforeEach(() => {
  mockedQuery.mockReset();
  mockedQueryOne.mockReset();
  mockedQuery.mockResolvedValue([]);
});

describe("POST /api/auth/register", () => {
  it("rejects a request with a weak password", async () => {
    const res = await request(app).post("/api/auth/register").send({
      name: "Jane",
      email: "jane@example.com",
      password: "weak",
    });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it("creates a new pending_verification account and returns no password hash", async () => {
    mockedQueryOne
      .mockResolvedValueOnce(null) // no existing user with this email
      .mockResolvedValueOnce({ user_id: "u1", name: "Jane", email: "jane@example.com", role: "member" });

    const res = await request(app).post("/api/auth/register").send({
      name: "Jane",
      email: "jane@example.com",
      password: "Passw0rd!",
    });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(JSON.stringify(res.body)).not.toMatch(/password/i);
  });

  it("returns 409 for an email that is registered but not yet verified", async () => {
    mockedQueryOne.mockResolvedValueOnce({
      user_id: "u1", role: "member", email_verified: false, membership_status: "pending_verification", password_hash: "x",
    });

    const res = await request(app).post("/api/auth/register").send({
      name: "Jane",
      email: "jane@example.com",
      password: "Passw0rd!",
    });

    expect(res.status).toBe(409);
  });

  it("requests a role switch (with correct password) instead of erroring, for an existing verified account", async () => {
    const password_hash = await bcrypt.hash("Passw0rd!", 12);
    mockedQueryOne.mockResolvedValueOnce({
      user_id: "u1", role: "member", email_verified: true, membership_status: "active", password_hash,
    });

    const res = await request(app).post("/api/auth/register").send({
      name: "Jane",
      email: "jane@example.com",
      password: "Passw0rd!",
      role: "researcher",
    });

    expect(res.status).toBe(200);
    expect(res.body.data.pendingApproval).toBe(true);
  });
});

describe("POST /api/auth/login", () => {
  it("rejects an unknown email with a generic 401 (no email enumeration)", async () => {
    mockedQueryOne.mockResolvedValueOnce(null);

    const res = await request(app).post("/api/auth/login").send({ email: "nope@example.com", password: "x" });

    expect(res.status).toBe(401);
    expect(res.body.message).toBe("Invalid email or password");
  });

  it("rejects a correct email with the wrong password", async () => {
    const password_hash = await bcrypt.hash("Correct1!", 12);
    mockedQueryOne.mockResolvedValueOnce({
      user_id: "u1", name: "Jane", email: "jane@example.com", role: "member",
      password_hash, membership_status: "active",
    });

    const res = await request(app).post("/api/auth/login").send({ email: "jane@example.com", password: "WrongPass1!" });

    expect(res.status).toBe(401);
  });

  it("blocks a suspended account even with the correct password", async () => {
    const password_hash = await bcrypt.hash("Correct1!", 12);
    mockedQueryOne.mockResolvedValueOnce({
      user_id: "u1", name: "Jane", email: "jane@example.com", role: "member",
      password_hash, membership_status: "suspended",
    });

    const res = await request(app).post("/api/auth/login").send({ email: "jane@example.com", password: "Correct1!" });

    expect(res.status).toBe(403);
    expect(res.body.message).toMatch(/suspended/i);
  });

  it("blocks an account still pending email verification", async () => {
    const password_hash = await bcrypt.hash("Correct1!", 12);
    mockedQueryOne.mockResolvedValueOnce({
      user_id: "u1", name: "Jane", email: "jane@example.com", role: "member",
      password_hash, membership_status: "pending_verification",
    });

    const res = await request(app).post("/api/auth/login").send({ email: "jane@example.com", password: "Correct1!" });

    expect(res.status).toBe(403);
    expect(res.body.message).toMatch(/not verified/i);
  });

  it("issues tokens and never leaks the password hash for a valid active login", async () => {
    const password_hash = await bcrypt.hash("Correct1!", 12);
    mockedQueryOne.mockResolvedValueOnce({
      user_id: "u1", name: "Jane", email: "jane@example.com", role: "member",
      password_hash, membership_status: "active",
    });

    const res = await request(app).post("/api/auth/login").send({ email: "jane@example.com", password: "Correct1!" });

    expect(res.status).toBe(200);
    expect(res.body.data.access_token).toBeTruthy();
    expect(res.body.data.refresh_token).toBeTruthy();
    expect(res.body.data.user.password_hash).toBeUndefined();
  });
});

describe("POST /api/auth/refresh", () => {
  it("rejects a missing refresh_token", async () => {
    const res = await request(app).post("/api/auth/refresh").send({});
    expect(res.status).toBe(400);
  });

  it("rejects a refresh token that fails JWT verification", async () => {
    const res = await request(app).post("/api/auth/refresh").send({ refresh_token: "not-a-real-jwt" });
    expect(res.status).toBe(401);
  });

  it("rejects a syntactically valid but revoked/expired refresh token (not found in DB)", async () => {
    const refreshToken = jwt.sign(
      { user_id: "u1", email: "jane@example.com", role: "member" },
      process.env.JWT_SECRET as string,
      { expiresIn: "7d" }
    );
    mockedQueryOne.mockResolvedValueOnce(null); // not found in refresh_tokens

    const res = await request(app).post("/api/auth/refresh").send({ refresh_token: refreshToken });

    expect(res.status).toBe(401);
  });

  it("revokes the refresh token and rejects when the account is no longer active", async () => {
    const refreshToken = jwt.sign(
      { user_id: "u1", email: "jane@example.com", role: "member" },
      process.env.JWT_SECRET as string,
      { expiresIn: "7d" }
    );
    mockedQueryOne
      .mockResolvedValueOnce({ token_id: "t1" }) // found in refresh_tokens
      .mockResolvedValueOnce({ membership_status: "suspended", role: "member" });

    const res = await request(app).post("/api/auth/refresh").send({ refresh_token: refreshToken });

    expect(res.status).toBe(403);
    expect(mockedQuery).toHaveBeenCalledWith(
      expect.stringContaining("DELETE FROM refresh_tokens"),
      expect.any(Array)
    );
  });

  it("issues a fresh token pair for a valid, active refresh", async () => {
    const refreshToken = jwt.sign(
      { user_id: "u1", email: "jane@example.com", role: "member" },
      process.env.JWT_SECRET as string,
      { expiresIn: "7d" }
    );
    mockedQueryOne
      .mockResolvedValueOnce({ token_id: "t1" })
      .mockResolvedValueOnce({ membership_status: "active", role: "member" });

    const res = await request(app).post("/api/auth/refresh").send({ refresh_token: refreshToken });

    expect(res.status).toBe(200);
    expect(res.body.data.access_token).toBeTruthy();
    expect(res.body.data.refresh_token).toBeTruthy();
  });
});

describe("GET /api/auth/me", () => {
  it("rejects a request with no Authorization header", async () => {
    const res = await request(app).get("/api/auth/me");
    expect(res.status).toBe(401);
  });

  it("rejects a request with an invalid token", async () => {
    const res = await request(app).get("/api/auth/me").set("Authorization", "Bearer garbage");
    expect(res.status).toBe(401);
  });

  it("returns the profile for a valid, active session", async () => {
    mockedQueryOne
      .mockResolvedValueOnce({ membership_status: "active", is_idle: false }) // checkAccountActiveAndFresh
      .mockResolvedValueOnce({ user_id: "u1", name: "Jane", email: "jane@example.com", role: "member" }); // /me handler

    const res = await request(app).get("/api/auth/me").set("Authorization", `Bearer ${tokenFor("u1", "member")}`);

    expect(res.status).toBe(200);
    expect(res.body.data.user_id).toBe("u1");
  });

  it("rejects a suspended account even with a structurally valid access token", async () => {
    mockedQueryOne.mockResolvedValueOnce({ membership_status: "suspended", is_idle: false });

    const res = await request(app).get("/api/auth/me").set("Authorization", `Bearer ${tokenFor("u1", "member")}`);

    expect(res.status).toBe(401);
    expect(res.body.message).toMatch(/not active/i);
  });
});
