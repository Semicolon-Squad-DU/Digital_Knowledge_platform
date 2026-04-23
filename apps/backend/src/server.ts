import "dotenv/config";
import express from "express";
import helmet from "helmet";
import cors from "cors";
import compression from "compression";
import morgan from "morgan";
import rateLimit from "express-rate-limit";

import { config } from "./config";
import { logger } from "./config/logger";
import { pool } from "./db/pool";
import { initializeElasticsearch } from "./services/elasticsearch.service";
import { startScheduler } from "./jobs/scheduler";
import { errorHandler, notFound } from "./middleware/error.middleware";

// Routes
import authRoutes from "./routes/auth.routes";
import archiveRoutes from "./routes/archive.routes";
import libraryRoutes from "./routes/library.routes";
import showcaseRoutes from "./routes/showcase.routes";
import researchRoutes from "./routes/research.routes";
import notificationRoutes from "./routes/notifications.routes";

const app = express();

// ── Security ──────────────────────────────────────────────────
app.use(helmet());
app.use(
  cors({
    origin: config.frontendUrl,
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

    app.listen(config.port, () => {
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
