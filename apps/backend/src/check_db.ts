import { query } from "./core/db/pool";

async function main() {
  try {
    const res = await query("SELECT item_id, title_en, title_bn, file_url, file_type, status, access_tier, uploaded_by FROM archive_items WHERE title_en ILIKE '%Poverty%' OR title_bn ILIKE '%Poverty%' OR title_en ILIKE '%Outlook%'");
    console.log("Archive Items Matching 'Poverty' or 'Outlook':");
    console.log(JSON.stringify(res, null, 2));

    const res2 = await query("SELECT item_id, title_en, file_url, file_type, status FROM archive_items ORDER BY created_at DESC LIMIT 5");
    console.log("Latest 5 Archive Items:");
    console.log(JSON.stringify(res2, null, 2));
  } catch (err) {
    console.error("DB Query error:", err);
  } finally {
    process.exit(0);
  }
}

main();
