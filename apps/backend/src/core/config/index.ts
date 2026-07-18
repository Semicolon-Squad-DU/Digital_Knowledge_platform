import dotenv from "dotenv";
import path from "path";

// Load apps/backend/.env by absolute path so config doesn't silently fall back
// to defaults when the process is launched from a different working directory.
dotenv.config({ path: path.resolve(__dirname, "../../../.env") });

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const config = {
  env: process.env.NODE_ENV || "development",
  port: parseInt(process.env.PORT || "4000", 10),
  apiUrl: process.env.API_URL || "http://localhost:4000",
  frontendUrl: process.env.FRONTEND_URL || "http://localhost:3000",

  db: {
    url: requireEnv("DATABASE_URL"),
  },

  jwt: {
    secret: requireEnv("JWT_SECRET"),
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || "15m",
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d",
    // NFR-006: server-side inactivity timeout, independent of and shorter
    // than the access token's own TTL — a token that's still cryptographically
    // valid is rejected once its owner has been idle this long.
    sessionInactivityTimeoutMinutes: parseInt(process.env.SESSION_INACTIVITY_TIMEOUT_MINUTES || "30", 10),
  },

  redis: {
    url: process.env.REDIS_URL || "redis://localhost:6379",
  },

  elasticsearch: {
    url: process.env.ELASTICSEARCH_URL || "http://localhost:9200",
  },

  clamav: {
    host: process.env.CLAMAV_HOST || "localhost",
    port: parseInt(process.env.CLAMAV_PORT || "3310", 10),
  },

  s3: {
    endpoint: process.env.S3_ENDPOINT || "http://localhost:9000",
    accessKey: process.env.S3_ACCESS_KEY || "dkp_minio_user",
    secretKey: process.env.S3_SECRET_KEY || "dkp_minio_password",
    bucket: process.env.S3_BUCKET_NAME || "dkp-files",
    region: process.env.S3_REGION || "us-east-1",
    forcePathStyle: process.env.S3_FORCE_PATH_STYLE === "true",
    capacityGB: parseInt(process.env.S3_CAPACITY_GB || "50", 10),
  },

  email: {
    host: process.env.SMTP_HOST || "localhost",
    port: parseInt(process.env.SMTP_PORT || "1025", 10),
    user: process.env.SMTP_USER || "",
    pass: process.env.SMTP_PASS || "",
    from: process.env.EMAIL_FROM || "noreply@dkp.edu.bd",
  },

  auth: {
    // Comma-separated list of allowed email domains for self-service registration.
    // Empty (the default) means all domains are allowed — any email, personal
    // or institutional, can register. Set ALLOWED_EMAIL_DOMAINS to restrict
    // registration to specific domains again.
    allowedDomains: (process.env.ALLOWED_EMAIL_DOMAINS || "").split(",").map(d => d.trim()).filter(Boolean),
    otpExpiryMinutes: parseInt(process.env.OTP_EXPIRY_MINUTES || "10", 10),
    // Must match NEXT_PUBLIC_GOOGLE_CLIENT_ID on the frontend. Used to verify
    // that a Google access token was actually issued to this app (rejects
    // tokens replayed from a different OAuth client). If unset, that specific
    // check is skipped with a loud warning — set this in any environment
    // that's reachable outside localhost.
    googleClientId: process.env.GOOGLE_CLIENT_ID || "",
  },

  library: {
    fineRatePerDay: parseFloat(process.env.FINE_RATE_PER_DAY || "5"),
    loanPeriodDays: parseInt(process.env.LOAN_PERIOD_DAYS || "14", 10),
    maxBorrowLimit: parseInt(process.env.MAX_BORROW_LIMIT || "5", 10),
    maxRenewals: parseInt(process.env.MAX_RENEWALS || "2", 10),
  },
} as const;
