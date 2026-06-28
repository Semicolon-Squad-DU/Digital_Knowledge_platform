import { canAccessTier, getAllowedTiers } from "../access-control";
import { AccessTier } from "@dkp/shared";

const ROLES = ["guest", "member", "student_author", "researcher", "archivist", "librarian", "admin"];
const TIERS: AccessTier[] = ["public", "member", "staff", "restricted"];

// Matrix mirroring the SRS's access-tier model (FR-TXX-007): every role
// should see exactly its documented set of tiers, nothing more.
const EXPECTED: Record<string, AccessTier[]> = {
  guest: ["public"],
  member: ["public", "member"],
  student_author: ["public", "member"],
  researcher: ["public", "member", "staff"],
  archivist: ["public", "member", "staff", "restricted"],
  librarian: ["public", "member", "staff"],
  admin: ["public", "member", "staff", "restricted"],
};

describe("access-control matrix", () => {
  for (const role of ROLES) {
    for (const tier of TIERS) {
      const shouldAllow = EXPECTED[role].includes(tier);
      it(`${shouldAllow ? "allows" : "blocks"} role '${role}' from tier '${tier}'`, () => {
        expect(canAccessTier(role, tier)).toBe(shouldAllow);
      });
    }
  }

  it("treats an unrecognized role like guest (public only)", () => {
    expect(getAllowedTiers("not-a-real-role")).toEqual(["public"]);
    expect(canAccessTier("not-a-real-role", "restricted")).toBe(false);
  });

  it("treats an undefined role (unauthenticated request) like guest", () => {
    expect(getAllowedTiers(undefined)).toEqual(["public"]);
  });

  it("only archivist and admin can reach restricted-tier content", () => {
    const withRestricted = ROLES.filter((r) => canAccessTier(r, "restricted"));
    expect(withRestricted.sort()).toEqual(["admin", "archivist"]);
  });
});
