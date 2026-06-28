import { calculateOverdueFine } from "../fine-calculator";

const RATE = 5; // Tk 5/day, matching the SRS-documented default

function daysFrom(base: Date, days: number): Date {
  const d = new Date(base);
  d.setDate(d.getDate() + days);
  return d;
}

describe("calculateOverdueFine", () => {
  const dueDate = new Date("2026-03-07T00:00:00Z");

  it("returns 0 when returned exactly on the due date", () => {
    expect(calculateOverdueFine(dueDate, dueDate, RATE)).toBe(0);
  });

  it("returns 0 when returned before the due date", () => {
    const early = daysFrom(dueDate, -2);
    expect(calculateOverdueFine(dueDate, early, RATE)).toBe(0);
  });

  it("charges 1 day's rate when returned 1 day late", () => {
    const oneDayLate = daysFrom(dueDate, 1);
    expect(calculateOverdueFine(dueDate, oneDayLate, RATE)).toBe(RATE);
  });

  it("charges the full multi-day rate when returned several days late (TC-TXX-014: 3 days -> Tk 15)", () => {
    const threeDaysLate = daysFrom(dueDate, 3);
    expect(calculateOverdueFine(dueDate, threeDaysLate, RATE)).toBe(15);
  });

  it("scales linearly with the configured rate", () => {
    const threeDaysLate = daysFrom(dueDate, 3);
    expect(calculateOverdueFine(dueDate, threeDaysLate, 10)).toBe(30);
  });

  it("floors partial days rather than rounding up", () => {
    const almostTwoDays = new Date(dueDate.getTime() + 1000 * 60 * 60 * 47); // 47h late
    expect(calculateOverdueFine(dueDate, almostTwoDays, RATE)).toBe(RATE); // floor(47/24) = 1 day
  });
});
