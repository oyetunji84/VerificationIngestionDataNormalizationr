/**
 * logger.js
 *
 * Structured logger using Winston.
 * Always log as JSON in production — parseable by log aggregators (Datadog, Loki etc.)
 * Human-readable in development for local dev experience.
 */

const { createLogger, format, transports } = require("winston");
const env = require("../config/env");

const logger = createLogger({
  level: env.IS_PRODUCTION ? "info" : "debug",
  format: env.IS_PRODUCTION
    ? format.combine(format.timestamp(), format.json())
    : format.combine(format.colorize(), format.timestamp(), format.simple()),
  transports: [new transports.Console()],
});

module.exports = logger;
