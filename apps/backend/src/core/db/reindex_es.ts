import { pool } from "./pool";
import { esClient, ARCHIVE_INDEX, CATALOG_INDEX, RESEARCH_INDEX, initializeElasticsearch } from "../../infrastructure/elasticsearch.service";
import { logger } from "../config/logger";

// Bulk-reindexes all published archive items and catalog items from Postgres
// into Elasticsearch. Needed whenever ES starts fresh (new environment, wiped
// volume, or the ICU plugin was just installed and the index had to be
// recreated) since items are otherwise only indexed at upload/edit time.
async function reindexArchive() {
  const { rows } = await pool.query(
    `SELECT ai.item_id, ai.title_en, ai.title_bn, ai.description, ai.authors,
            ai.category, ai.language, ai.access_tier, ai.status, ai.file_type, ai.created_at,
            COALESCE(array_agg(t.name_en) FILTER (WHERE t.name_en IS NOT NULL), '{}') AS tags
     FROM archive_items ai
     LEFT JOIN archive_item_tags ait ON ai.item_id = ait.item_id
     LEFT JOIN tags t ON ait.tag_id = t.tag_id
     WHERE ai.deleted_at IS NULL
     GROUP BY ai.item_id`
  );

  if (rows.length === 0) {
    logger.info("No archive items to index");
    return;
  }

  const operations = rows.flatMap((doc) => [
    { index: { _index: ARCHIVE_INDEX, _id: doc.item_id } },
    doc,
  ]);

  const result = await esClient.bulk({ operations, refresh: true });
  const errors = result.items.filter((i) => i.index?.error);
  logger.info("Archive reindex complete", { indexed: rows.length - errors.length, failed: errors.length });
  if (errors.length) logger.warn("First archive index error", { error: errors[0].index?.error });
}

async function reindexCatalog() {
  const { rows } = await pool.query(
    `SELECT catalog_id, title, authors, isbn, category, available_copies, year
     FROM catalog_items
     WHERE deleted_at IS NULL`
  );

  if (rows.length === 0) {
    logger.info("No catalog items to index");
    return;
  }

  const operations = rows.flatMap((doc) => [
    { index: { _index: CATALOG_INDEX, _id: doc.catalog_id } },
    doc,
  ]);

  const result = await esClient.bulk({ operations, refresh: true });
  const errors = result.items.filter((i) => i.index?.error);
  logger.info("Catalog reindex complete", { indexed: rows.length - errors.length, failed: errors.length });
  if (errors.length) logger.warn("First catalog index error", { error: errors[0].index?.error });
}

async function reindexResearch() {
  const { rows } = await pool.query(
    `SELECT ro.*, u.name as uploader_name, l.name as lab_name
     FROM research_outputs ro
     JOIN users u ON ro.uploaded_by = u.user_id
     LEFT JOIN labs l ON ro.lab_id = l.lab_id`
  );

  if (rows.length === 0) {
    logger.info("No research outputs to index");
    return;
  }

  const operations = rows.flatMap((doc) => {
    const authors = doc.authors as Array<{ name?: string }> | undefined;
    const authors_text = Array.isArray(authors) ? authors.map((a) => a?.name ?? "").join(", ") : "";
    return [
      { index: { _index: RESEARCH_INDEX, _id: doc.output_id } },
      { ...doc, authors_text },
    ];
  });

  const result = await esClient.bulk({ operations, refresh: true });
  const errors = result.items.filter((i) => i.index?.error);
  logger.info("Research reindex complete", { indexed: rows.length - errors.length, failed: errors.length });
  if (errors.length) logger.warn("First research index error", { error: errors[0].index?.error });
}

async function main() {
  await initializeElasticsearch();
  await reindexArchive();
  await reindexCatalog();
  await reindexResearch();
  await pool.end();
}

main().catch((e) => { console.error(e); process.exit(1); });
