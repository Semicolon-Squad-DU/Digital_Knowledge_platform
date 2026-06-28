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
  },

  redis: {
    url: process.env.REDIS_URL || "redis://localhost:6379",
  },

  elasticsearch: {
    url: process.env.ELASTICSEARCH_URL || "http://localhost:9200",
  },

  s3: {
    endpoint: process.env.S3_ENDPOINT || "http://localhost:9000",
    accessKey: process.env.S3_ACCESS_KEY || "dkp_minio_user",
    secretKey: process.env.S3_SECRET_KEY || "dkp_minio_password",
    bucket: process.env.S3_BUCKET_NAME || "dkp-files",
    region: process.env.S3_REGION || "us-east-1",
    forcePathStyle: process.env.S3_FORCE_PATH_STYLE === "true",
  },

  email: {
    host: process.env.SMTP_HOST || "localhost",
    port: parseInt(process.env.SMTP_PORT || "1025", 10),
    user: process.env.SMTP_USER || "",
    pass: process.env.SMTP_PASS || "",
    from: process.env.EMAIL_FROM || "noreply@dkp.edu.bd",
  },

  library: {
    fineRatePerDay: parseFloat(process.env.FINE_RATE_PER_DAY || "5"),
    loanPeriodDays: parseInt(process.env.LOAN_PERIOD_DAYS || "14", 10),
    maxBorrowLimit: parseInt(process.env.MAX_BORROW_LIMIT || "5", 10),
  },
} as const;
