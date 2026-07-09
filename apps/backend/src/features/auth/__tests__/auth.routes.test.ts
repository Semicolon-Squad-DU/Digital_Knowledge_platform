import { registerValidation, generateTokens, SELF_SERVICE_ROLES, APPROVAL_REQUIRED_ROLES } from "../auth.routes";
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

  // All 6 roles are selectable at registration. The privileged ones
  // (researcher, archivist, librarian, admin) still pass field validation
  // here — the actual gate is that they land in "pending_approval" and need
  // an existing admin to approve them (enforced in the /verify-email and
  // /oauth-login route handlers via APPROVAL_REQUIRED_ROLES), not a
  // rejection at this validation layer.
  it.each(["member", "student_author", "researcher", "archivist", "librarian", "admin"])(
    "accepts role '%s' at the registration form layer",
    async (role) => {
      const result = await runValidation({ ...validBase, role });
      expect(result.isEmpty()).toBe(true);
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

describe("role approval gating", () => {
  // This exact boundary was accidentally reverted once already — keep it
  // pinned so member/student_author never silently require approval, and
  // the privileged roles never silently skip it.
  it("requires admin approval only for researcher, archivist, librarian, and admin", () => {
    expect(new Set(APPROVAL_REQUIRED_ROLES)).toEqual(
      new Set(["researcher", "archivist", "librarian", "admin"])
    );
  });

  it("grants member and student_author immediate active status (no approval)", () => {
    expect(APPROVAL_REQUIRED_ROLES).not.toContain("member");
    expect(APPROVAL_REQUIRED_ROLES).not.toContain("student_author");
  });

  it("every approval-required role is still a valid self-service registration choice", () => {
    for (const role of APPROVAL_REQUIRED_ROLES) {
      expect(SELF_SERVICE_ROLES).toContain(role);
    }
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
