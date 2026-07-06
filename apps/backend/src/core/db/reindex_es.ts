import { pool } from "./pool";
import { esClient, ARCHIVE_INDEX, initializeElasticsearch } from "../../infrastructure/elasticsearch.service";
import { logger } from "../config/logger";

// Bulk-reindexes all published archive items from Postgres into Elasticsearch.
// Needed whenever ES starts fresh (new environment, wiped volume) since items
// are otherwise only indexed at upload time.
async function main() {
  await initializeElasticsearch();

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
    await pool.end();
    return;
  }

  const operations = rows.flatMap((doc) => [
    { index: { _index: ARCHIVE_INDEX, _id: doc.item_id } },
    doc,
  ]);

  const result = await esClient.bulk({ operations, refresh: true });
  const errors = result.items.filter((i) => i.index?.error);
  logger.info("Archive reindex complete", { indexed: rows.length - errors.length, failed: errors.length });
  if (errors.length) logger.warn("First index error", { error: errors[0].index?.error });

  await pool.end();
}

main().catch((e) => { console.error(e); process.exit(1); });
