const { initTelemetry } = require("./config/telemetry");
initTelemetry();

// ── Step 2: Everything else ───────────────────────────────────────────────────
const { connectDatabase } = require("./config/database");
const { connectRedis } = require("./config/redis");
const { createServer, startServer } = require("./config/server");
const handlers = require("./modules/billing/handlers");
const interceptors = require("./interceptors");
const logger = require("./utils/logger");

const bootstrap = async () => {
  try {
    logger.info("Starting billing service...");

    await connectDatabase();
    await connectRedis();

    const server = createServer(handlers, interceptors);
    await startServer(server);

    logger.info("Billing service ready");
  } catch (error) {
    logger.error("Failed to start billing service", { error: error.message });
    process.exit(1);
  }
};

bootstrap();
