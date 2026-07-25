import "dotenv/config";
import express from "express";
import helmet from "helmet";
import cors from "cors";
import compression from "compression";
import morgan from "morgan";
import rateLimit from "express-rate-limit";

import { config } from "./core/config";
import { logger } from "./core/config/logger";
import { pool } from "./core/db/pool";
import { initializeElasticsearch } from "./infrastructure/elasticsearch.service";
import { tusServer, TUS_PATH } from "./infrastructure/tus.service";
import { initializeAntivirus } from "./infrastructure/antivirus.service";
import { startScheduler } from "./jobs/scheduler";
import { errorHandler, notFound } from "./core/middleware/error.middleware";

// Routes
import authRoutes from "./features/auth/auth.routes";
import archiveRoutes from "./features/archive/archive.routes";
import libraryRoutes from "./features/library/library.routes";
import showcaseRoutes from "./features/showcase/showcase.routes";
import researchRoutes from "./features/research/research.routes";
import notificationRoutes from "./features/notifications/notifications.routes";
import adminRoutes from "./routes/admin.routes";
import commentsRoutes from "./routes/comments.routes";
import reactionsRoutes from "./routes/reactions.routes";
import eventsRoutes from "./routes/events.routes";
import contactRoutes from "./routes/contact.routes";

const app = express();

// ── Security ──────────────────────────────────────────────────
app.use(helmet());
const isProduction = config.env === "production";
const allowedOrigins = [
  config.frontendUrl,
  ...(isProduction ? [] : ["http://localhost:3000", "http://0.0.0.0:3000", "http://127.0.0.1:3000"]),
];

app.use(
  cors({
    origin: (origin, callback) => {
      // allow requests with no origin (mobile apps, curl, etc.)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      // allow any request from a private LAN subnet (e.g. testing from a phone
      // on the same WiFi) — dev only. Covers the two common home/office router
      // ranges: 10.x.x.x and 192.168.x.x.
      if (!isProduction && /^http:\/\/(10\.\d+\.\d+\.\d+|192\.168\.\d+\.\d+)(:\d+)?$/.test(origin)) return callback(null, true);
      callback(new Error(`CORS blocked: ${origin}`));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Content-Type", "Authorization",
      // tus resumable-upload protocol headers (large-file archive uploads)
      "Tus-Resumable", "Upload-Length", "Upload-Metadata", "Upload-Offset", "Upload-Defer-Length",
    ],
    exposedHeaders: [
      "Location", "Upload-Offset", "Upload-Length",
      "Tus-Version", "Tus-Resumable", "Tus-Max-Size", "Tus-Extension",
    ],
  })
);

// ── Health / readiness checks ───────────────────────────────────
// Registered before the rate limiter: orchestrator healthchecks (Docker's
// polls /health every 15s — see docker-compose.prod.yml) must never compete
// with real traffic for the same per-IP budget. When the backend is hit at
// localhost (e.g. testing docker-compose.prod.yml locally), the healthcheck
// and the browser's own API calls resolve to the same loopback IP, so an
// unlimited healthcheck endpoint sitting behind the limiter would silently
// eat a third of the window's budget before a single user request lands.
app.get("/health", async (_req, res) => {
  try {
    await pool.query("SELECT 1");
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  } catch {
    res.status(503).json({ status: "degraded" });
  }
});

let isReady = false;
app.get("/ready", (_req, res) => {
  if (isReady) {
    res.json({ status: "ready" });
  } else {
    res.status(503).json({ status: "starting" });
  }
});

// ── Rate limiting ─────────────────────────────────────────────
// These limits are per-IP, and every request from this dev machine — every
// tab, every background poll, every manual curl/script test — shares the
// same IP. That blows through production-sized budgets in minutes during
// active testing (e.g. rapid login/logout across test accounts), locking
// out the very person testing the app. Only enforce in production, where
// requests actually come from distinct real clients (isProduction declared
// above, next to the CORS origin allowlist that makes the same distinction).
//
// `max` is generous on purpose: this is a shared, site-wide backstop against
// abuse/scraping, not a per-feature quota. A single archive/library page view
// alone fires several API calls (search, filters, pagination, item detail),
// and on a shared/NAT'd IP that's multiplied across every concurrent user —
// a low ceiling here trips for ordinary browsing long before it catches
// actual abuse, and masks the auth-specific limiter below (mounted after
// this one, so it only ever fires if this budget isn't already spent).
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many requests, please try again later" },
  skip: () => !isProduction,
});

// Tighter, auth-only budget: brute-force protection on login/register, kept
// separate from the general browsing budget above.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many auth attempts" },
  skip: () => !isProduction,
});

app.use(limiter);

// ── Body parsing ──────────────────────────────────────────────
app.use(compression());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// ── Logging ───────────────────────────────────────────────────
app.use(
  morgan("combined", {
    stream: { write: (msg) => logger.http(msg.trim()) },
    skip: (req) => req.path === "/health",
  })
);

// ── Resumable uploads (tus protocol) ────────────────────────────
// Mounted with Express's raw req/res via .handle() — tus's own body handling
// reads the request stream directly, so this must not sit behind a body-parser
// that would consume it (express.json()/urlencoded() above safely skip this,
// since they only act on matching Content-Types).
app.all(`${TUS_PATH}*`, (req, res) => {
  tusServer.handle(req, res).catch((err) => {
    logger.error("tus handler error", { error: (err as Error).message });
    if (!res.headersSent) res.status(500).end();
  });
});

// ── API Routes ────────────────────────────────────────────────
app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/archive", archiveRoutes);
app.use("/api/library", libraryRoutes);
app.use("/api/showcase", showcaseRoutes);
app.use("/api/research", researchRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/comments", commentsRoutes);
app.use("/api/reactions", reactionsRoutes);
app.use("/api/events", eventsRoutes);
app.use("/api/contact", contactRoutes);

// ── Error handling ────────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

// ── Start ─────────────────────────────────────────────────────
async function bootstrap(): Promise<void> {
  try {
    await pool.query("SELECT 1");
    logger.info("PostgreSQL connected");

    await initializeElasticsearch();
    await initializeAntivirus();

    if (config.env !== "test") {
      await startScheduler();
    }

    const server = app.listen(config.port, "0.0.0.0", () => {
      isReady = true;
      logger.info(`DKP API running on port ${config.port}`, {
        env: config.env,
        port: config.port,
      });
    });

    const shutdown = (signal: string) => {
      logger.info(`${signal} received, shutting down gracefully`);
      isReady = false;
      server.close(async () => {
        try {
          await pool.end();
          logger.info("Shutdown complete");
          process.exit(0);
        } catch (err) {
          logger.error("Error during shutdown", { error: (err as Error).message });
          process.exit(1);
        }
      });
    };

    process.on("SIGTERM", () => shutdown("SIGTERM"));
    process.on("SIGINT", () => shutdown("SIGINT"));
  } catch (err) {
    console.error("Full startup error:", err);
    logger.error("Failed to start server", { error: (err as Error).message || err });
    process.exit(1);
  }
}

bootstrap();

export default app;
