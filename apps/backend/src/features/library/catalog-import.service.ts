import ExcelJS from "exceljs";
import { isValidIsbn } from "../../core/utils/isbn";
import { parseCsv } from "../../core/utils/csv";
import { query } from "../../core/db/pool";

export interface CatalogImportRow {
  title: string;
  isbn?: string;
  authors: string[];
  publisher?: string;
  edition?: string;
  year?: number;
  category?: string;
  total_copies: number;
  shelf_location?: string;
  description?: string;
  barcode?: string;
}

export interface ImportRowResult {
  row_number: number;
  data: CatalogImportRow | null;
  status: "valid" | "invalid" | "duplicate";
  errors: string[];
}

// Accepts common header spellings from CSV/Excel exports (case/space/underscore-insensitive).
const HEADER_ALIASES: Record<string, keyof CatalogImportRow | "authors_raw"> = {
  title: "title",
  isbn: "isbn",
  author: "authors_raw",
  authors: "authors_raw",
  publisher: "publisher",
  edition: "edition",
  year: "year",
  publicationyear: "year",
  category: "category",
  totalcopies: "total_copies",
  copies: "total_copies",
  totalcopy: "total_copies",
  shelflocation: "shelf_location",
  location: "shelf_location",
  description: "description",
  summary: "description",
  barcode: "barcode",
};

function normalizeHeader(h: string): string {
  return h.toLowerCase().replace(/[\s_-]/g, "");
}

/** XLSX files are ZIP archives — the first two bytes are always "PK" (0x50 0x4B). */
function looksLikeXlsx(buffer: Buffer): boolean {
  return buffer.length > 4 && buffer[0] === 0x50 && buffer[1] === 0x4b;
}

/** Parses an Excel worksheet's first sheet into header→value row objects
 *  (same shape parseCsv produces, so validateImportRows works unchanged). */
async function parseXlsx(buffer: Buffer): Promise<Record<string, string>[]> {
  const workbook = new ExcelJS.Workbook();
  // exceljs's bundled type defs predate the newer strict Buffer<ArrayBufferLike>
  // generic in recent @types/node — a plain Buffer is valid at runtime either way.
  await workbook.xlsx.load(buffer as unknown as ArrayBuffer);
  const sheet = workbook.worksheets[0];
  if (!sheet) return [];

  const headers: string[] = [];
  sheet.getRow(1).eachCell({ includeEmpty: true }, (cell, colNumber) => {
    headers[colNumber - 1] = String(cell.value ?? "").trim();
  });

  const rows: Record<string, string>[] = [];
  sheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    if (rowNumber === 1) return; // header row
    const obj: Record<string, string> = {};
    headers.forEach((header, i) => {
      if (!header) return;
      const cell = row.getCell(i + 1);
      const value = cell.value;
      // Cells can hold dates, formula results, or rich text objects — flatten to a plain string.
      obj[header] =
        value == null ? "" :
        value instanceof Date ? value.toISOString().slice(0, 10) :
        typeof value === "object" && "result" in value ? String((value as { result: unknown }).result ?? "") :
        typeof value === "object" && "text" in value ? String((value as { text: unknown }).text ?? "") :
        String(value);
    });
    rows.push(obj);
  });

  return rows;
}

/** Parses a CSV or XLSX buffer into an array of raw header→value row objects. */
export async function parseCatalogFile(buffer: Buffer): Promise<Record<string, string>[]> {
  if (looksLikeXlsx(buffer)) return parseXlsx(buffer);

  let text = buffer.toString("utf8");
  // Strip a leading byte-order mark (common from Excel "Save as CSV") — checked by
  // char code rather than a regex literal to avoid an invisible-character source line.
  if (text.charCodeAt(0) === 0xfeff) text = text.slice(1);
  return parseCsv(text);
}

function mapRow(raw: Record<string, string>): Partial<CatalogImportRow> & { authors_raw?: string } {
  const mapped: Record<string, string> = {};
  for (const [key, value] of Object.entries(raw)) {
    const alias = HEADER_ALIASES[normalizeHeader(key)];
    if (alias) mapped[alias] = String(value ?? "").trim();
  }

  const authors = mapped.authors_raw
    ? mapped.authors_raw.split(/[;,]/).map((a) => a.trim()).filter(Boolean)
    : [];

  return {
    title: mapped.title,
    isbn: mapped.isbn || undefined,
    authors,
    publisher: mapped.publisher || undefined,
    edition: mapped.edition || undefined,
    year: mapped.year ? parseInt(mapped.year, 10) : undefined,
    category: mapped.category || undefined,
    total_copies: mapped.total_copies ? parseInt(mapped.total_copies, 10) : NaN,
    shelf_location: mapped.shelf_location || undefined,
    description: mapped.description || undefined,
    barcode: mapped.barcode || undefined,
  };
}

/**
 * Validates parsed rows against per-row rules, in-file duplicates, and
 * duplicates already present in the catalog — mirrors the SDD's "per-row
 * validation, duplicate detection, error summary before commit" requirement.
 */
export async function validateImportRows(rawRows: Record<string, string>[]): Promise<ImportRowResult[]> {
  const seenIsbnsInFile = new Set<string>();
  const candidateIsbns = rawRows
    .map((r) => mapRow(r).isbn)
    .filter((isbn): isbn is string => !!isbn);

  const existing = candidateIsbns.length
    ? await query<{ isbn: string }>(
        "SELECT isbn FROM catalog_items WHERE isbn = ANY($1) AND deleted_at IS NULL",
        [candidateIsbns]
      )
    : [];
  const existingIsbns = new Set(existing.map((r) => r.isbn));

  return rawRows.map((raw, idx) => {
    const row = mapRow(raw);
    const errors: string[] = [];

    if (!row.title || !row.title.trim()) errors.push("Title is required");
    if (!row.total_copies || isNaN(row.total_copies) || row.total_copies < 1) {
      errors.push("Total copies must be a positive number");
    }
    if (row.isbn && !isValidIsbn(row.isbn)) errors.push(`Invalid ISBN checksum: "${row.isbn}"`);
    if (row.year && (row.year < 1000 || row.year > new Date().getUTCFullYear() + 1)) {
      errors.push(`Implausible year: ${row.year}`);
    }

    if (errors.length > 0) {
      return { row_number: idx + 2, data: null, status: "invalid", errors }; // +2: header row + 1-index
    }

    const data: CatalogImportRow = {
      title: row.title!.trim(),
      isbn: row.isbn,
      authors: row.authors ?? [],
      publisher: row.publisher,
      edition: row.edition,
      year: row.year,
      category: row.category || "General",
      total_copies: row.total_copies!,
      shelf_location: row.shelf_location,
      description: row.description,
      barcode: row.barcode,
    };

    if (data.isbn) {
      const isDuplicate = existingIsbns.has(data.isbn) || seenIsbnsInFile.has(data.isbn);
      seenIsbnsInFile.add(data.isbn);
      if (isDuplicate) {
        return {
          row_number: idx + 2,
          data,
          status: "duplicate",
          errors: [`ISBN ${data.isbn} already exists in the catalog or appears earlier in this file`],
        };
      }
    }

    return { row_number: idx + 2, data, status: "valid", errors: [] };
  });
}
