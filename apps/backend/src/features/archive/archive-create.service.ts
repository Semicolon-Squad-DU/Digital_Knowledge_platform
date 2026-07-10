import { withTransaction } from "../../core/db/pool";
import { indexArchiveItem } from "../../infrastructure/elasticsearch.service";
import { notifyAllUsersExcept } from "../../infrastructure/notification.service";
import { logger } from "../../core/config/logger";

export interface CreateArchiveItemParams {
  key: string;
  fileType: string;
  fileSize: number;
  uploadedBy: string;
  ip: string;
  title_en: string;
  title_bn?: string | null;
  description?: string | null;
  authors?: string; // JSON-encoded string[]
  category?: string;
  language?: string;
  access_tier?: string;
  status?: string;
  tags?: string; // JSON-encoded string[]
  custom_metadata?: string; // JSON-encoded object
}

/**
 * Shared archive_items creation logic — used by both the direct multipart
 * upload route and the tus-resumable-upload finalize route, so a large file
 * uploaded via tus ends up as the exact same kind of record as a small file
 * uploaded via the plain multer path.
 */
export async function createArchiveItemRecord(params: CreateArchiveItemParams) {
  const initialStatus =
    params.status && ["draft", "review", "published", "archived"].includes(params.status)
      ? params.status
      : "published";

  const item = await withTransaction(async (client) => {
    const result = await client.query(
      `INSERT INTO archive_items
         (title_en, title_bn, description, authors, category, language, access_tier, status, file_url, file_type, file_size, uploaded_by, custom_metadata)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
       RETURNING *`,
      [
        params.title_en, params.title_bn || null, params.description || null,
        params.authors ? JSON.parse(params.authors) : [],
        params.category || "General", params.language || "en",
        params.access_tier || "public", initialStatus,
        params.key, params.fileType, params.fileSize, params.uploadedBy,
        params.custom_metadata ? JSON.parse(params.custom_metadata) : {},
      ]
    );

    await client.query(
      `INSERT INTO archive_versions (item_id, version_number, file_url, metadata_snapshot, changed_by)
       VALUES ($1, 1, $2, $3, $4)`,
      [result.rows[0].item_id, params.key, JSON.stringify(result.rows[0]), params.uploadedBy]
    );

    if (params.tags) {
      const tagNames: string[] = typeof params.tags === "string" ? JSON.parse(params.tags) : params.tags;
      const uniqueNames = [...new Set(tagNames.map((t) => t.trim()).filter(Boolean))];

      if (uniqueNames.length > 0) {
        const tagPlaceholders = uniqueNames.map((_, i) => `($${i + 1})`).join(", ");
        const tagResult = await client.query(
          `INSERT INTO tags (name_en) VALUES ${tagPlaceholders}
           ON CONFLICT (name_en) DO UPDATE SET name_en = EXCLUDED.name_en
           RETURNING tag_id`,
          uniqueNames
        );

        const linkValues = tagResult.rows.map((_, i) => `($1, $${i + 2})`).join(", ");
        await client.query(
          `INSERT INTO archive_item_tags (item_id, tag_id) VALUES ${linkValues} ON CONFLICT DO NOTHING`,
          [result.rows[0].item_id, ...tagResult.rows.map((r) => r.tag_id)]
        );
      }
    }

    await client.query(
      `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details, ip_address)
       VALUES ($1, 'CREATE', 'archive_item', $2, $3, $4)`,
      [params.uploadedBy, result.rows[0].item_id, JSON.stringify({ title_en: params.title_en }), params.ip]
    );

    return result.rows[0];
  });

  indexArchiveItem({
    item_id: item.item_id, title_en: item.title_en, title_bn: item.title_bn,
    description: item.description, authors: item.authors, category: item.category,
    language: item.language, access_tier: item.access_tier, status: item.status,
    file_type: item.file_type, created_at: item.created_at,
  }).catch((err) => logger.error("ES indexing failed", { error: (err as Error).message }));

  // Draft/review items 404 for everyone except staff (see GET /:id) — don't
  // notify the whole platform about a document nobody but staff can open yet.
  if (item.status === "published") {
    void notifyAllUsersExcept(params.uploadedBy, {
      type: "new_upload",
      title: "New Document Uploaded",
      message: `"${item.title_en}" has been added to the archive.`,
      action_url: `/archive/${item.item_id}`,
    });
  }

  return item;
}
