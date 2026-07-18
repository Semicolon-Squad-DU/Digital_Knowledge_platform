import { parsePagination } from "../pagination";
import { AppError } from "../../middleware/error.middleware";

describe("parsePagination", () => {
  it("computes offset correctly for a normal page/limit", () => {
    expect(parsePagination("1", "20")).toEqual({ page: 1, limit: 20, offset: 0 });
    expect(parsePagination("3", "20")).toEqual({ page: 3, limit: 20, offset: 40 });
    expect(parsePagination("5", "10")).toEqual({ page: 5, limit: 10, offset: 40 });
  });

  it("respects a custom maxLimit", () => {
    expect(parsePagination("1", "50", 50)).toEqual({ page: 1, limit: 50, offset: 0 });
  });

  it("rejects page 0 and negative pages", () => {
    expect(() => parsePagination("0", "20")).toThrow(AppError);
    expect(() => parsePagination("-1", "20")).toThrow(AppError);
  });

  it("rejects non-integer page values, including the NaN case from bad query strings", () => {
    expect(() => parsePagination("abc", "20")).toThrow(AppError);
    expect(() => parsePagination("1.5", "20")).toThrow(AppError);
    expect(() => parsePagination("", "20")).toThrow(AppError);
  });

  it("rejects limit 0, negative limit, and limit above maxLimit", () => {
    expect(() => parsePagination("1", "0")).toThrow(AppError);
    expect(() => parsePagination("1", "-5")).toThrow(AppError);
    expect(() => parsePagination("1", "101")).toThrow(AppError);
  });

  it("accepts limit exactly at the maxLimit boundary", () => {
    expect(parsePagination("1", "100")).toEqual({ page: 1, limit: 100, offset: 0 });
  });

  it("throws a 400 AppError with a descriptive message, not a raw parse error", () => {
    try {
      parsePagination("abc", "20");
      fail("expected parsePagination to throw");
    } catch (err) {
      expect(err).toBeInstanceOf(AppError);
      expect((err as AppError).statusCode).toBe(400);
      expect((err as AppError).message).toMatch(/page must be a positive integer/);
    }
  });
});
