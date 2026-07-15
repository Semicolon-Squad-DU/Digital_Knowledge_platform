import { AppError } from "../middleware/error.middleware";

export interface Pagination {
  page: number;
  limit: number;
  offset: number;
}

/**
 * Validates page/limit query params and computes the LIMIT/OFFSET pair.
 * A bare `parseInt` on an unvalidated query string turns things like `?page=abc`
 * into NaN, which then reaches the database as an invalid parameter and 500s with
 * a raw Postgres error instead of a clean 400 — this rejects that input up front.
 */
export function parsePagination(pageStr: string, limitStr: string, maxLimit = 100): Pagination {
  const page = Number(pageStr);
  const limit = Number(limitStr);

  if (!Number.isInteger(page) || page < 1) {
    throw new AppError(400, "page must be a positive integer");
  }
  if (!Number.isInteger(limit) || limit < 1 || limit > maxLimit) {
    throw new AppError(400, `limit must be a positive integer between 1 and ${maxLimit}`);
  }

  return { page, limit, offset: (page - 1) * limit };
}
