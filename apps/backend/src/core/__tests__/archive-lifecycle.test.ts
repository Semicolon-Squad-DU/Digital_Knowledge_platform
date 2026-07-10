import { getArchiveTransitionRule } from "../archive-lifecycle";

describe("getArchiveTransitionRule — SDD lifecycle: Draft → Review → Published → Archived", () => {
  it.each([
    ["draft", "review"],
    ["review", "published"],
    ["published", "archived"],
  ])("allows the forward transition %s → %s", (from, to) => {
    expect(getArchiveTransitionRule(from, to)).toBe("forward");
  });

  it.each([
    ["review", "draft"],
    ["published", "review"],
    ["published", "draft"],
    ["archived", "published"],
  ])("flags %s → %s as a regression (Archivist/Admin only)", (from, to) => {
    expect(getArchiveTransitionRule(from, to)).toBe("regression");
  });

  it.each([
    ["draft", "published"],   // can't skip review
    ["draft", "archived"],    // can't skip straight to archived
    ["review", "archived"],   // must be published first
    ["archived", "draft"],    // can't jump straight back to draft
    ["archived", "review"],
    ["draft", "draft"],       // no-op isn't a real transition
    ["published", "published"],
  ])("blocks the invalid transition %s → %s", (from, to) => {
    expect(getArchiveTransitionRule(from, to)).toBe("invalid");
  });

  it("treats unknown statuses as invalid rather than throwing", () => {
    expect(getArchiveTransitionRule("draft", "deleted")).toBe("invalid");
    expect(getArchiveTransitionRule("bogus", "draft")).toBe("invalid");
  });
});
