import { registerValidation, generateTokens } from "../auth.routes";
import { validationResult } from "express-validator";
import type { Request } from "express";

async function runValidation(body: Record<string, unknown>) {
  const req = { body } as Request;
  for (const validator of registerValidation) {
    await validator.run(req);
  }
  return validationResult(req);
}

describe("registerValidation", () => {
  const validBase = {
    name: "Test User",
    email: "test@example.com",
    password: "Test@123456",
  };

  it("accepts a request with no role (defaults to member downstream)", async () => {
    const result = await runValidation(validBase);
    expect(result.isEmpty()).toBe(true);
  });

  it.each(["member", "student_author", "researcher"])(
    "accepts the non-privileged role '%s'",
    async (role) => {
      const result = await runValidation({ ...validBase, role });
      expect(result.isEmpty()).toBe(true);
    }
  );

  it.each(["admin", "librarian", "archivist"])(
    "rejects the privileged role '%s' on public registration",
    async (role) => {
      const result = await runValidation({ ...validBase, role });
      expect(result.isEmpty()).toBe(false);
      const errors = result.array();
      expect(errors.some((e) => "path" in e && e.path === "role")).toBe(true);
    }
  );

  it("rejects an unknown role string", async () => {
    const result = await runValidation({ ...validBase, role: "superadmin" });
    expect(result.isEmpty()).toBe(false);
  });

  it("rejects a weak password", async () => {
    const result = await runValidation({ ...validBase, password: "weak" });
    expect(result.isEmpty()).toBe(false);
  });

  it("rejects a missing name", async () => {
    const result = await runValidation({ ...validBase, name: "" });
    expect(result.isEmpty()).toBe(false);
  });
});

describe("generateTokens", () => {
  it("issues an access and refresh token containing the given identity", () => {
    const tokens = generateTokens("user-123", "test@example.com", "member");
    expect(tokens.access_token).toBeTruthy();
    expect(tokens.refresh_token).toBeTruthy();
    expect(tokens.access_token).not.toEqual(tokens.refresh_token);
  });

  it("encodes role into the token payload", () => {
    const jwt = require("jsonwebtoken");
    const tokens = generateTokens("user-123", "test@example.com", "librarian");
    const decoded = jwt.decode(tokens.access_token) as { role: string };
    expect(decoded.role).toBe("librarian");
  });
});
