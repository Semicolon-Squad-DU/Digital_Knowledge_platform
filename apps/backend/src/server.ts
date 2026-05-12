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
import { startScheduler } from "./jobs/scheduler";
import { errorHandler, notFound } from "./core/middleware/error.middleware";

// Routes
import authRoutes from "./features/auth/auth.routes";
import archiveRoutes from "./features/archive/archive.routes";
import libraryRoutes from "./features/library/library.routes";
import showcaseRoutes from "./features/showcase/showcase.routes";
import researchRoutes from "./features/research/research.routes";
import notificationRoutes from "./features/notifications/notifications.routes";

const app = express();

// ── Security ──────────────────────────────────────────────────
app.use(helmet());
const allowedOrigins = [
  config.frontendUrl,
  "http://localhost:3000",
  "http://0.0.0.0:3000",
  "http://127.0.0.1:3000",
];

app.use(
  cors({
    origin: (origin, callback) => {
      // allow requests with no origin (mobile apps, curl, etc.)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      // allow any request from the same subnet (LAN access)
      if (/^http:\/\/10\.\d+\.\d+\.\d+(:\d+)?$/.test(origin)) return callback(null, true);
      callback(new Error(`CORS blocked: ${origin}`));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// ── Rate limiting ─────────────────────────────────────────────
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many requests, please try again later" },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many auth attempts" },
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

// ── Health check ──────────────────────────────────────────────
app.get("/health", async (_req, res) => {
  try {
    await pool.query("SELECT 1");
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  } catch {
    res.status(503).json({ status: "degraded" });
  }
});

// ── API Routes ────────────────────────────────────────────────
app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/archive", archiveRoutes);
app.use("/api/library", libraryRoutes);
app.use("/api/showcase", showcaseRoutes);
app.use("/api/research", researchRoutes);
app.use("/api/notifications", notificationRoutes);

// ── Error handling ────────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

// ── Start ─────────────────────────────────────────────────────
async function bootstrap(): Promise<void> {
  try {
    await pool.query("SELECT 1");
    logger.info("PostgreSQL connected");

    await initializeElasticsearch();

    if (config.env !== "test") {
      startScheduler();
    }

    app.listen(config.port, "0.0.0.0", () => {
      logger.info(`DKP API running on port ${config.port}`, {
        env: config.env,
        port: config.port,
      });
    });
  } catch (err) {
    console.error("Full startup error:", err);
    logger.error("Failed to start server", { error: (err as Error).message || err });
    process.exit(1);
  }
}

bootstrap();

export default app;
