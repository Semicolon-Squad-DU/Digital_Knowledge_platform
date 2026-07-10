import ExcelJS from "exceljs";
import { parseCatalogFile } from "../catalog-import.service";

async function buildXlsxBuffer(headers: string[], rows: (string | number)[][]): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Catalog");
  sheet.addRow(headers);
  rows.forEach((r) => sheet.addRow(r));
  const arrayBuffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(arrayBuffer as ArrayBuffer);
}

describe("parseCatalogFile", () => {
  it("parses a CSV buffer into header→value rows", async () => {
    const csv = "title,isbn,total_copies\nIntro to Algorithms,9780262033848,3\n";
    const rows = await parseCatalogFile(Buffer.from(csv, "utf8"));
    expect(rows).toEqual([{ title: "Intro to Algorithms", isbn: "9780262033848", total_copies: "3" }]);
  });

  it("strips a UTF-8 BOM from CSV input", async () => {
    const csv = "﻿title,total_copies\nBook A,1\n";
    const rows = await parseCatalogFile(Buffer.from(csv, "utf8"));
    expect(rows[0].title).toBe("Book A");
  });

  it("parses an XLSX buffer into the same header→value shape as CSV", async () => {
    const buffer = await buildXlsxBuffer(
      ["title", "isbn", "authors", "total_copies", "year"],
      [
        ["Clean Code", "9780132350884", "Robert Martin", 2, 2008],
        ["Book Two", "", "Author A; Author B", 1, ""],
      ]
    );

    const rows = await parseCatalogFile(buffer);
    expect(rows).toHaveLength(2);
    expect(rows[0]).toEqual({
      title: "Clean Code", isbn: "9780132350884", authors: "Robert Martin",
      total_copies: "2", year: "2008",
    });
    expect(rows[1].title).toBe("Book Two");
    expect(rows[1].authors).toBe("Author A; Author B");
  });

  it("formats XLSX date cells as YYYY-MM-DD rather than a Date toString", async () => {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Catalog");
    sheet.addRow(["title", "published"]);
    sheet.addRow(["Dated Book", new Date("2020-05-15T00:00:00.000Z")]);
    const buffer = Buffer.from((await workbook.xlsx.writeBuffer()) as ArrayBuffer);

    const rows = await parseCatalogFile(buffer);
    expect(rows[0].published).toBe("2020-05-15");
  });
});
