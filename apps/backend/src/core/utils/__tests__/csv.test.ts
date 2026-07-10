import { parseCsv } from "../csv";

describe("parseCsv", () => {
  it("parses simple comma-separated rows into header→value objects", () => {
    const rows = parseCsv("title,isbn\nIntro to Algorithms,9780262033848\n");
    expect(rows).toEqual([{ title: "Intro to Algorithms", isbn: "9780262033848" }]);
  });

  it("handles quoted fields with embedded commas", () => {
    const rows = parseCsv('title,authors\n"Clean Code, A Handbook",Robert Martin\n');
    expect(rows[0].title).toBe("Clean Code, A Handbook");
    expect(rows[0].authors).toBe("Robert Martin");
  });

  it("handles escaped double quotes inside quoted fields", () => {
    const rows = parseCsv('title\n"The ""Great"" Gatsby"\n');
    expect(rows[0].title).toBe('The "Great" Gatsby');
  });

  it("handles CRLF line endings and trailing rows without a final newline", () => {
    const rows = parseCsv("title,year\r\nBook A,2020\r\nBook B,2021");
    expect(rows).toEqual([
      { title: "Book A", year: "2020" },
      { title: "Book B", year: "2021" },
    ]);
  });

  it("returns an empty array for empty input", () => {
    expect(parseCsv("")).toEqual([]);
  });

  it("pads missing trailing columns with empty strings", () => {
    const rows = parseCsv("title,isbn,year\nBook A\n");
    expect(rows[0]).toEqual({ title: "Book A", isbn: "", year: "" });
  });
});
