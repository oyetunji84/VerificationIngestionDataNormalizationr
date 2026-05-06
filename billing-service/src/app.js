const { initTelemetry } = require("./config/telemetry");
initTelemetry();
require("./config/env");
// ── Step 2: Everything else ───────────────────────────────────────────────────
const { connectDatabase, disconnectDatabase } = require("./config/database");
const { connectRedis, disconnectRedis } = require("./config/redis");
const { createServer, startServer } = require("./config/server");
const handlers = require("./modules/billing/handlers");
const interceptors = require("./interceptors");
const logger = require("./utils/logger");

const gracefulShutdown = async (signal, server) => {
  logger.info(`${signal} received — shutting down billing service...`);

  await new Promise((resolve, reject) => {
    server.tryShutdown((err) => {
      if (err) {
        logger.error("gRPC server failed to shutdown gracefully, forcing...");
        server.forceShutdown();
      }
      logger.info("gRPC server closed");
      resolve();
    });
  });

  await disconnectRedis();
  logger.info("Redis connection closed");

  await disconnectDatabase();
  logger.info("Database connection closed");

  logger.info("Billing service shut down cleanly");
  process.exit(0);
};
const bootstrap = async () => {
  try {
    logger.info("Starting billing service...");

    await connectDatabase();
    try {
      await connectRedis();
    } catch (err) {
      logger.error(err, "1 I am the best");
    }

    const server = createServer(handlers, interceptors);
    await startServer(server);
    process.on("SIGINT", () => gracefulShutdown("SIGINT", server));
    process.on("SIGTERM", () => gracefulShutdown("SIGTERM", server));
    logger.info("Billing service ready");
  } catch (error) {
    console.log(error);
    logger.error("Failed to start billing service", { error: error.message });
    process.exit(1);
  }
};

bootstrap();
