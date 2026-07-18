/**
 * Download Stitch screen HTML + preview image via @google/stitch-sdk
 * (same Stitch MCP server: https://stitch.googleapis.com/mcp).
 *
 * Auth (pick one):
 *   - OAuth (often required for MCP): STITCH_ACCESS_TOKEN + GOOGLE_CLOUD_PROJECT (or STITCH_QUOTA_PROJECT_ID)
 *   - API key: STITCH_API_KEY (or STITCH_MCP_GOOGLE_API_KEY) — may be rejected for MCP; use OAuth if you see that error
 *
 * Usage:
 *   node scripts/fetch-stitch-screen.mjs [projectId] [screenId] [outDir]
 *
 * Defaults: Digital Knowledge Nexus → Research Repository Vault.
 */
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

const projectId = process.argv[2] ?? "17389970200680884475";
const screenId = process.argv[3] ?? "5382a3f4c90b4bf09ba056968f8c217c";
const outDir = path.resolve(
  process.argv[4] ?? path.join(root, "design/stitch-exports/research-repository-vault")
);

const { Stitch, StitchToolClient } = await import("@google/stitch-sdk");

const accessToken = process.env.STITCH_ACCESS_TOKEN;
const quotaProject =
  process.env.GOOGLE_CLOUD_PROJECT ||
  process.env.STITCH_QUOTA_PROJECT_ID ||
  process.env.GCP_PROJECT;

const apiKey =
  process.env.STITCH_API_KEY ||
  process.env.STITCH_MCP_GOOGLE_API_KEY ||
  process.env.GOOGLE_API_KEY;

let sdk;
let closeFn = async () => {};

if (accessToken) {
  const client = new StitchToolClient({
    accessToken,
    projectId: quotaProject,
    baseUrl: process.env.STITCH_HOST ?? "https://stitch.googleapis.com/mcp",
  });
  sdk = new Stitch(client);
  closeFn = () => client.close();
} else if (apiKey) {
  process.env.STITCH_API_KEY = apiKey;
  const { stitch } = await import("@google/stitch-sdk");
  sdk = stitch;
  closeFn = () => stitch.close?.() ?? Promise.resolve();
} else {
  console.error(
    "Set credentials:\n" +
      "  OAuth: STITCH_ACCESS_TOKEN (+ GOOGLE_CLOUD_PROJECT for quota)\n" +
      "  Or key: STITCH_API_KEY (may not work for Stitch MCP — prefer OAuth)"
  );
  process.exit(1);
}

async function downloadToFile(url, dest) {
  const res = await fetch(url, { redirect: "follow" });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`GET ${url} → ${res.status} ${res.statusText}\n${body.slice(0, 500)}`);
  }
  const buf = Buffer.from(await res.arrayBuffer());
  await fs.mkdir(path.dirname(dest), { recursive: true });
  await fs.writeFile(dest, buf);
}

try {
  const project = sdk.project(projectId);
  const screen = await project.getScreen(screenId);

  const htmlUrl = await screen.getHtml();
  const imageUrl = await screen.getImage();

  console.log("Project:", projectId);
  console.log("Screen:", screenId);
  console.log("HTML URL:", htmlUrl);
  console.log("Image URL:", imageUrl);

  await fs.mkdir(outDir, { recursive: true });

  const htmlPath = path.join(outDir, "screen.html");
  const imgPath = path.join(outDir, "screen-preview.png");

  await downloadToFile(htmlUrl, htmlPath);
  await downloadToFile(imageUrl, imgPath);

  await fs.writeFile(
    path.join(outDir, "urls.json"),
    JSON.stringify(
      { projectId, screenId, htmlUrl, imageUrl, downloadedAt: new Date().toISOString() },
      null,
      2
    ),
    "utf8"
  );

  console.log("\nSaved:");
  console.log(" ", htmlPath);
  console.log(" ", imgPath);
  console.log(" ", path.join(outDir, "urls.json"));
} catch (e) {
  const msg = e instanceof Error ? e.message : String(e);
  console.error(msg);
  if (msg.includes("API keys are not supported")) {
    console.error(
      "\nStitch MCP expects OAuth. Obtain an access token (see Google Cloud auth docs), then:\n" +
        "  export STITCH_ACCESS_TOKEN=\"ya29...\"\n" +
        "  export GOOGLE_CLOUD_PROJECT=\"your-gcp-project-id\"\n" +
        "  npm run stitch:export-screen"
    );
  }
  process.exit(1);
} finally {
  await closeFn().catch(() => {});
}
