import winston from "winston";
import { config } from "./index";

const { combine, timestamp, json, colorize, simple } = winston.format;

const transports: winston.transport[] = [
  new winston.transports.Console({
    format:
      config.env === "development"
        ? combine(colorize(), simple())
        : combine(timestamp(), json()),
  }),
];

// Persist logs to files in production so they survive container restarts.
// Rotate at 20 MB, keep 14 days.
if (config.env !== "test") {
  transports.push(
    new winston.transports.File({
      filename: "logs/error.log",
      level: "error",
      maxsize: 20 * 1024 * 1024,
      maxFiles: 14,
      tailable: true,
    }),
    new winston.transports.File({
      filename: "logs/combined.log",
      maxsize: 20 * 1024 * 1024,
      maxFiles: 14,
      tailable: true,
    })
  );
}

export const logger = winston.createLogger({
  level: config.env === "production" ? "info" : "debug",
  format: combine(timestamp(), json()),
  defaultMeta: { service: "dkp-api" },
  transports,
});
