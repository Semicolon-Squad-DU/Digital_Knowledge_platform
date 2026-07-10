import { Client } from "@elastic/elasticsearch";
import { config } from "../core/config";
import { logger } from "../core/config/logger";
import { query as dbQuery } from "../core/db/pool";

// Short timeout + no retries: when Elasticsearch is down, fail fast instead
// of stalling every search request for ~9s (default client retries 3x with
// a 30s request timeout each).
export const esClient = new Client({
  node: config.elasticsearch.url,
  requestTimeout: 3000,
  maxRetries: 0,
});

const ARCHIVE_INDEX = "dkp_archive";
const CATALOG_INDEX = "dkp_catalog";
const RESEARCH_INDEX = "dkp_research";

// Set once at startup so per-request search/index calls can skip straight to
// the PostgreSQL fallback instead of re-discovering "ES is down" every time.
let isElasticsearchAvailable = false;

export async function initializeElasticsearch(): Promise<void> {
  isElasticsearchAvailable = false;
  logger.info("Elasticsearch is disabled. Falling back to PostgreSQL (Supabase) search directly.");
}

async function createArchiveIndex(): Promise<void> {
  const exists = await esClient.indices.exists({ index: ARCHIVE_INDEX });
  if (exists) return;

  await esClient.indices.create({
    index: ARCHIVE_INDEX,
    body: {
      settings: {
        analysis: {
          analyzer: {
            bangla_analyzer: {
              type: "custom",
              tokenizer: "icu_tokenizer",
              filter: ["icu_normalizer", "icu_folding"],
            },
            english_analyzer: {
              type: "english",
            },
          },
        },
      },
      mappings: {
        properties: {
          item_id: { type: "keyword" },
          title_en: {
            type: "text",
            analyzer: "english_analyzer",
            fields: { keyword: { type: "keyword" } },
          },
          title_bn: {
            type: "text",
            analyzer: "bangla_analyzer",
          },
          description: { type: "text", analyzer: "english_analyzer" },
          authors: { type: "keyword" },
          tags: { type: "keyword" },
          category: { type: "keyword" },
          language: { type: "keyword" },
          access_tier: { type: "keyword" },
          status: { type: "keyword" },
          file_type: { type: "keyword" },
          created_at: { type: "date" },
        },
      },
    },
  });
  logger.info(`Elasticsearch index '${ARCHIVE_INDEX}' created`);
}

async function createCatalogIndex(): Promise<void> {
  const exists = await esClient.indices.exists({ index: CATALOG_INDEX });
  if (exists) return;

  await esClient.indices.create({
    index: CATALOG_INDEX,
    body: {
      mappings: {
        properties: {
          catalog_id: { type: "keyword" },
          title: {
            type: "text",
            analyzer: "english",
            fields: { keyword: { type: "keyword" } },
          },
          authors: { type: "text", fields: { keyword: { type: "keyword" } } },
          isbn: { type: "keyword" },
          category: { type: "keyword" },
          available_copies: { type: "integer" },
          year: { type: "integer" },
        },
      },
    },
  });
  logger.info(`Elasticsearch index '${CATALOG_INDEX}' created`);
}

async function createResearchIndex(): Promise<void> {
  const exists = await esClient.indices.exists({ index: RESEARCH_INDEX });
  if (exists) return;

  await esClient.indices.create({
    index: RESEARCH_INDEX,
    body: {
      mappings: {
        properties: {
          output_id: { type: "keyword" },
          title: { type: "text", analyzer: "english", fields: { keyword: { type: "keyword" } } },
          abstract: { type: "text", analyzer: "english" },
          keywords: { type: "keyword" },
          authors_text: { type: "text" },
          output_type: { type: "keyword" },
          access_tier: { type: "keyword" },
          lab_id: { type: "keyword" },
          uploaded_by: { type: "keyword" },
          journal_name: { type: "keyword" },
          published_date: { type: "date" },
          created_at: { type: "date" },
        },
      },
    },
  });
  logger.info(`Elasticsearch index '${RESEARCH_INDEX}' created`);
}

export async function indexArchiveItem(item: Record<string, unknown>): Promise<void> {
  if (!isElasticsearchAvailable) {
    logger.warn("Skipping archive indexing — Elasticsearch unavailable", { item_id: item.item_id });
    return;
  }
  try {
    await esClient.index({
      index: ARCHIVE_INDEX,
      id: item.item_id as string,
      document: item,
    });
  } catch (err) {
    logger.warn("Archive indexing failed", { item_id: item.item_id, error: (err as Error).message });
  }
}

export async function indexCatalogItem(item: Record<string, unknown>): Promise<void> {
  if (!isElasticsearchAvailable) {
    logger.warn("Skipping catalog indexing — Elasticsearch unavailable", { catalog_id: item.catalog_id });
    return;
  }
  try {
    await esClient.index({
      index: CATALOG_INDEX,
      id: item.catalog_id as string,
      document: item,
    });
  } catch (err) {
    logger.warn("Catalog indexing failed", { catalog_id: item.catalog_id, error: (err as Error).message });
  }
}

export async function removeCatalogItemFromIndex(catalog_id: string): Promise<void> {
  if (!isElasticsearchAvailable) return;
  try {
    await esClient.delete({ index: CATALOG_INDEX, id: catalog_id });
  } catch (err) {
    // 404 just means it was never indexed (e.g. created before ES was available) — not an error.
    logger.warn("Catalog index removal failed", { catalog_id, error: (err as Error).message });
  }
}

export async function indexResearchOutput(output: Record<string, unknown>): Promise<void> {
  if (!isElasticsearchAvailable) {
    logger.warn("Skipping research indexing — Elasticsearch unavailable", { output_id: output.output_id });
    return;
  }
  try {
    const authors = output.authors as Array<{ name?: string }> | undefined;
    const authors_text = Array.isArray(authors) ? authors.map((a) => a?.name ?? "").join(", ") : "";

    await esClient.index({
      index: RESEARCH_INDEX,
      id: output.output_id as string,
      document: { ...output, authors_text },
    });
  } catch (err) {
    logger.warn("Research indexing failed", { output_id: output.output_id, error: (err as Error).message });
  }
}

export async function removeArchiveItemFromIndex(item_id: string): Promise<void> {
  if (!isElasticsearchAvailable) return;
  try {
    await esClient.delete({ index: ARCHIVE_INDEX, id: item_id });
  } catch (err) {
    // 404 just means it was never indexed (e.g. created before ES was available) — not an error.
    logger.warn("Archive index removal failed", { item_id, error: (err as Error).message });
  }
}

export async function searchArchive(params: {
  query?: string;
  category?: string;
  language?: string;
  access_tier?: string;
  file_type?: string;
  date_from?: string;
  date_to?: string;
  tags?: string[];
  page?: number;
  limit?: number;
  allowed_tiers?: string[];
}): Promise<{ hits: unknown[]; total: number }> {
  const { query, page = 1, limit = 20, allowed_tiers = ["public"] } = params;
  const from = (page - 1) * limit;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const must: any[] = [{ terms: { access_tier: allowed_tiers } }];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const filter: any[] = [{ term: { status: "published" } }];

  if (query) {
    must.push({
      multi_match: {
        query,
        fields: ["title_en^3", "title_bn^3", "description", "authors^2", "tags"],
        type: "best_fields",
        fuzziness: "AUTO",
      },
    });
  }

  if (params.category) filter.push({ term: { category: params.category } });
  if (params.language) filter.push({ term: { language: params.language } });
  if (params.file_type) filter.push({ term: { file_type: params.file_type } });
  if (params.tags?.length) filter.push({ terms: { tags: params.tags } });

  if (params.date_from || params.date_to) {
    const range: Record<string, string> = {};
    if (params.date_from) range.gte = params.date_from;
    if (params.date_to) range.lte = params.date_to;
    filter.push({ range: { created_at: range } });
  }

  try {
    if (!isElasticsearchAvailable) throw new Error("Elasticsearch unavailable (skipped)");
    const result = await esClient.search({
      index: ARCHIVE_INDEX,
      from,
      size: limit,
      query: { bool: { must, filter } },
      sort: query ? ["_score"] : [{ created_at: "desc" }],
    });

    return {
      hits: result.hits.hits.map((h) => ({ ...(h._source as object), _score: h._score })),
      total: typeof result.hits.total === "number" ? result.hits.total : result.hits.total?.value ?? 0,
    };
  } catch (err) {
    logger.warn("Archive search falling back to PostgreSQL", { error: (err as Error).message });

    const where: string[] = ["ai.status = 'published'", "ai.access_tier = ANY($1)"];
    const values: unknown[] = [allowed_tiers];
    let i = 2;

    if (params.query) {
      where.push(`(
        ai.title_en ILIKE $${i}
        OR COALESCE(ai.title_bn, '') ILIKE $${i}
        OR COALESCE(ai.description, '') ILIKE $${i}
        OR array_to_string(ai.authors, ' ') ILIKE $${i}
      )`);
      values.push(`%${params.query}%`);
      i += 1;
    }
    if (params.category) {
      where.push(`ai.category = $${i}`);
      values.push(params.category);
      i += 1;
    }
    if (params.language) {
      where.push(`ai.language = $${i}`);
      values.push(params.language);
      i += 1;
    }
    if (params.file_type) {
      where.push(`ai.file_type = $${i}`);
      values.push(params.file_type);
      i += 1;
    }
    if (params.date_from) {
      where.push(`ai.created_at >= $${i}`);
      values.push(params.date_from);
      i += 1;
    }
    if (params.date_to) {
      where.push(`ai.created_at <= $${i}`);
      values.push(params.date_to);
      i += 1;
    }

    const countRows = await dbQuery<{ total: string }>(
      `SELECT COUNT(*)::text as total
       FROM archive_items ai
       WHERE ${where.join(" AND ")}`,
      values
    );

    const dataRows = await dbQuery(
      `SELECT
         ai.*,
         COALESCE(
           json_agg(
             DISTINCT jsonb_build_object('tag_id', t.tag_id, 'name_en', t.name_en, 'name_bn', t.name_bn)
           ) FILTER (WHERE t.tag_id IS NOT NULL),
           '[]'::json
         ) as tags
       FROM archive_items ai
       LEFT JOIN archive_item_tags ait ON ai.item_id = ait.item_id
       LEFT JOIN tags t ON ait.tag_id = t.tag_id
       WHERE ${where.join(" AND ")}
       GROUP BY ai.item_id
       ORDER BY ai.created_at DESC
       LIMIT $${i} OFFSET $${i + 1}`,
      [...values, limit, from]
    );

    return {
      hits: dataRows,
      total: parseInt(countRows[0]?.total ?? "0", 10),
    };
  }
}

export async function searchCatalog(params: {
  query?: string;
  author?: string;
  isbn?: string;
  category?: string;
  availability?: string;
  year_from?: number;
  year_to?: number;
  page?: number;
  limit?: number;
}): Promise<{ hits: unknown[]; total: number }> {
  const { query, page = 1, limit = 20 } = params;
  const from = (page - 1) * limit;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const must: any[] = [];
  // Deleted items are removed from the index (see removeCatalogItemFromIndex),
  // not flagged — ES never indexes explicit nulls by default, so a
  // `term: { deleted_at: null }` filter would never match anything.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const filter: any[] = [];

  if (query) {
    must.push({
      multi_match: {
        query,
        fields: ["title^3", "authors^2", "isbn", "description"],
        fuzziness: "AUTO",
      },
    });
  }

  if (params.author) filter.push({ match: { authors: params.author } });
  if (params.isbn) filter.push({ term: { isbn: params.isbn } });
  if (params.category) filter.push({ term: { category: params.category } });
  if (params.availability === "available") {
    filter.push({ range: { available_copies: { gt: 0 } } });
  }

  try {
    if (!isElasticsearchAvailable) throw new Error("Elasticsearch unavailable (skipped)");
    const result = await esClient.search({
      index: CATALOG_INDEX,
      from,
      size: limit,
      query: must.length ? { bool: { must, filter } } : { bool: { filter } },
    });

    return {
      hits: result.hits.hits.map((h) => h._source),
      total: typeof result.hits.total === "number" ? result.hits.total : result.hits.total?.value ?? 0,
    };
  } catch (err) {
    logger.warn("Catalog search falling back to PostgreSQL", { error: (err as Error).message });

    const where: string[] = ["deleted_at IS NULL"];
    const values: unknown[] = [];
    let i = 1;

    if (params.query) {
      where.push(`(
        title ILIKE $${i}
        OR array_to_string(authors, ' ') ILIKE $${i}
        OR COALESCE(isbn, '') ILIKE $${i}
        OR COALESCE(description, '') ILIKE $${i}
      )`);
      values.push(`%${params.query}%`);
      i += 1;
    }
    if (params.author) {
      where.push(`array_to_string(authors, ' ') ILIKE $${i}`);
      values.push(`%${params.author}%`);
      i += 1;
    }
    if (params.isbn) {
      where.push(`isbn = $${i}`);
      values.push(params.isbn);
      i += 1;
    }
    if (params.category) {
      where.push(`category = $${i}`);
      values.push(params.category);
      i += 1;
    }
    if (params.availability === "available") {
      where.push("available_copies > 0");
    }
    if (params.availability === "on_loan") {
      where.push("available_copies = 0");
    }
    if (typeof params.year_from === "number") {
      where.push(`year >= $${i}`);
      values.push(params.year_from);
      i += 1;
    }
    if (typeof params.year_to === "number") {
      where.push(`year <= $${i}`);
      values.push(params.year_to);
      i += 1;
    }

    const countRows = await dbQuery<{ total: string }>(
      `SELECT COUNT(*)::text as total FROM catalog_items WHERE ${where.join(" AND ")}`,
      values
    );
    const dataRows = await dbQuery(
      `SELECT *
       FROM catalog_items
       WHERE ${where.join(" AND ")}
       ORDER BY created_at DESC
       LIMIT $${i} OFFSET $${i + 1}`,
      [...values, limit, from]
    );

    return {
      hits: dataRows,
      total: parseInt(countRows[0]?.total ?? "0", 10),
    };
  }
}

export async function searchResearch(params: {
  query?: string;
  author?: string;
  keyword?: string;
  year?: number;
  output_type?: string;
  lab_id?: string;
  uploaded_by?: string;
  allowed_tiers?: string[];
  page?: number;
  limit?: number;
}): Promise<{ hits: unknown[]; total: number }> {
  const { query, page = 1, limit = 20, allowed_tiers = ["public"] } = params;
  const from = (page - 1) * limit;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const must: any[] = [{ terms: { access_tier: allowed_tiers } }];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const filter: any[] = [];

  if (query) {
    must.push({
      multi_match: {
        query,
        fields: ["title^3", "abstract", "authors_text^2", "keywords"],
        type: "best_fields",
        fuzziness: "AUTO",
      },
    });
  }

  if (params.author) must.push({ match: { authors_text: params.author } });
  if (params.keyword) filter.push({ term: { keywords: params.keyword } });
  if (params.output_type) filter.push({ term: { output_type: params.output_type } });
  if (params.lab_id) filter.push({ term: { lab_id: params.lab_id } });
  if (params.uploaded_by) filter.push({ term: { uploaded_by: params.uploaded_by } });
  if (params.year) {
    filter.push({
      range: {
        published_date: {
          gte: `${params.year}-01-01`,
          lte: `${params.year}-12-31`,
        },
      },
    });
  }

  try {
    if (!isElasticsearchAvailable) throw new Error("Elasticsearch unavailable (skipped)");
    const result = await esClient.search({
      index: RESEARCH_INDEX,
      from,
      size: limit,
      query: { bool: { must, filter } },
      sort: query ? ["_score"] : [{ created_at: "desc" }],
    });

    return {
      hits: result.hits.hits.map((h) => ({ ...(h._source as object), _score: h._score })),
      total: typeof result.hits.total === "number" ? result.hits.total : result.hits.total?.value ?? 0,
    };
  } catch (err) {
    logger.warn("Research search falling back to PostgreSQL", { error: (err as Error).message });

    const conditions: string[] = ["ro.access_tier = ANY($1)"];
    const values: unknown[] = [allowed_tiers];
    let idx = 2;

    if (params.query) {
      conditions.push(`(ro.title ILIKE $${idx} OR ro.abstract ILIKE $${idx})`);
      values.push(`%${params.query}%`);
      idx += 1;
    }
    if (params.author) {
      conditions.push(`ro.authors::text ILIKE $${idx}`);
      values.push(`%${params.author}%`);
      idx += 1;
    }
    if (params.keyword) {
      conditions.push(`$${idx} = ANY(ro.keywords)`);
      values.push(params.keyword);
      idx += 1;
    }
    if (params.year) {
      conditions.push(`EXTRACT(YEAR FROM ro.published_date) = $${idx}`);
      values.push(params.year);
      idx += 1;
    }
    if (params.output_type) {
      conditions.push(`ro.output_type = $${idx}`);
      values.push(params.output_type);
      idx += 1;
    }
    if (params.lab_id) {
      conditions.push(`ro.lab_id = $${idx}`);
      values.push(params.lab_id);
      idx += 1;
    }
    if (params.uploaded_by) {
      conditions.push(`ro.uploaded_by = $${idx}`);
      values.push(params.uploaded_by);
      idx += 1;
    }

    const where = `WHERE ${conditions.join(" AND ")}`;

    const countRows = await dbQuery<{ count: string }>(
      `SELECT COUNT(*) as count FROM research_outputs ro ${where}`,
      values
    );

    const dataRows = await dbQuery(
      `SELECT ro.*, u.name as uploader_name, l.name as lab_name
       FROM research_outputs ro
       JOIN users u ON ro.uploaded_by = u.user_id
       LEFT JOIN labs l ON ro.lab_id = l.lab_id
       ${where}
       ORDER BY ro.created_at DESC
       LIMIT $${idx} OFFSET $${idx + 1}`,
      [...values, limit, from]
    );

    return {
      hits: dataRows,
      total: parseInt(countRows[0]?.count ?? "0", 10),
    };
  }
}

export { ARCHIVE_INDEX, CATALOG_INDEX, RESEARCH_INDEX };
