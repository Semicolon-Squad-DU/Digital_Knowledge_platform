import winston from "winston";
import { config } from "./index";

const { combine, timestamp, json, colorize, simple } = winston.format;

export const logger = winston.createLogger({
  level: config.env === "production" ? "info" : "debug",
  format: combine(timestamp(), json()),
  defaultMeta: { service: "dkp-api" },
  transports: [
    new winston.transports.Console({
      format:
        config.env === "development"
          ? combine(colorize(), simple())
          : combine(timestamp(), json()),
    }),
  ],
});
