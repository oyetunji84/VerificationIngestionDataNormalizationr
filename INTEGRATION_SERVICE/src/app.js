const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

const companyRoutes = require("./routes/companyRoutes");
const verificationRoutes = require("./routes/verificationROutes");
const historyRoutes = require("./routes/historyRoutes");
const walletRoutes = require("./routes/walletRoutes");
const { redisClient } = require("./infra/redisDb");
const { pool } = require("./infra/postgresDb");
const { getChannel } = require("./infra/rabbitmq");
const { getElasticsearchClient } = require("./infra/elasticSearch");

const {
  errorHandler,
  notFoundHandler,
} = require("./middlewares/errorMiddleware");

const app = express();

app.use(cors());
app.use(express.json({ limit: "10mb" }));

app.use((req, res, next) => {
  function normalizeEndpoint(path) {
    return path
      .replace(/^\/api\//, "")
      .replace(/^\/|\/$/g, "")
      .replace(/\//g, "-")
      .toLowerCase();
  }

  console.log("Incoming request", {
    method: req.method,
    path: normalizeEndpoint(req.path),
    ip: req.ip,
    userAgent: req.get("user-agent"),
  });

  next();
});

app.get("/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    service: "Identity Verification Integration Service",
    timestamp: new Date().toISOString(),
  });
});

app.get("/health/live", (req, res) => {
  res.status(200).json({
    status: "live",
    service: "integration-service",
    timestamp: new Date().toISOString(),
  });
});

app.get("/health/ready", async (req, res) => {
  const readiness = {
    mongo: mongoose.connection?.readyState === 1,
    redis: redisClient?.isOpen === true,
    postgres: false,
    rabbitmq: false,
    elasticsearch: false,
  };

  try {
    await pool.query("SELECT 1");
    readiness.postgres = true;
  } catch (error) {
    readiness.postgres = false;
  }

  try {
    const channel = await getChannel();
    readiness.rabbitmq = Boolean(channel);
  } catch (error) {
    readiness.rabbitmq = false;
  }

  try {
    const client = getElasticsearchClient();
    await client.ping();
    readiness.elasticsearch = true;
  } catch (error) {
    readiness.elasticsearch = false;
  }

  const ready = Object.values(readiness).every(Boolean);
  return res.status(ready ? 200 : 503).json({
    status: ready ? "ready" : "not_ready",
    checks: readiness,
    timestamp: new Date().toISOString(),
  });
});

app.use("/api/company", companyRoutes);
app.use("/api/verify", verificationRoutes);
app.use("/api/history", historyRoutes);
app.use("/api/wallet", walletRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = { app };
