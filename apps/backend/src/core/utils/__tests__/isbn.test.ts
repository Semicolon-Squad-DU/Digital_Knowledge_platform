import { isValidIsbn } from "../isbn";

describe("isValidIsbn", () => {
  it("accepts a valid ISBN-10", () => {
    expect(isValidIsbn("0262033844")).toBe(true);
  });

  it("accepts a valid ISBN-10 with hyphens and an X check digit", () => {
    expect(isValidIsbn("0-9752298-0-X")).toBe(true);
  });

  it("accepts a valid ISBN-13", () => {
    expect(isValidIsbn("9780262033848")).toBe(true);
  });

  it("accepts a valid ISBN-13 with hyphens", () => {
    expect(isValidIsbn("978-0-262-03384-8")).toBe(true);
  });

  it("rejects a bad checksum", () => {
    expect(isValidIsbn("9780262033849")).toBe(false);
    expect(isValidIsbn("0262033845")).toBe(false);
  });

  it("rejects wrong-length or non-numeric input", () => {
    expect(isValidIsbn("12345")).toBe(false);
    expect(isValidIsbn("not-an-isbn")).toBe(false);
    expect(isValidIsbn("")).toBe(false);
  });
});
