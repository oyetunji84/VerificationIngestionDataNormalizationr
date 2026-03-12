const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const verifyRoutes = require("../src/route/verifyRoute");
const webHookRoutes = require("../src/route/webhookRoute");
const mongoose = require("mongoose");
const { sequelize } = require("../src/config/Postgress");
const { redisClient } = require("../src/config/redis");
const { getChannel } = require("../src/config/rabbitmq");
const { getElasticsearchClient } = require("./config/elasticsearch");
const { getMetrics } = require("../src/utils/metrics");

const { elasticSchema } = require("./model/elasticSearchModel");
const app = express();

app.use(helmet());
app.use(cors());
app.use(morgan("dev"));
app.use(express.json());

app.get("/health/live", (req, res) => {
  res.status(200).json({ status: "UP", service: "Verification Gateway" });
});

app.get("/health/ready", async (req, res) => {
  const checks = {
    mongo: mongoose.connection.readyState === 1 ? "UP" : "DOWN",
    postgres: "DOWN",
    redis: redisClient.isOpen ? "UP" : "DOWN",
    rabbitmq: getChannel() ? "UP" : "DOWN",
    elasticsearch: "DOWN",
  };

  try {
    await sequelize.authenticate();
    checks.postgres = "UP";
  } catch (error) {
    checks.postgres = "DOWN";
  }

  try {
    const esClient = getElasticsearchClient();
    await esClient.cluster.health({ index: elasticSchema.index });
    checks.elasticsearch = "UP";
  } catch (error) {
    checks.elasticsearch = "DOWN";
  }

  const allUp = Object.values(checks).every((value) => value === "UP");
  res.status(allUp ? 200 : 503).json({
    status: allUp ? "UP" : "DEGRADED",
    service: "Verification Gateway",
    checks,
  });
});

app.get("/health", (req, res) => {
  res.status(200).json({ status: "UP", service: "Verification Gateway" });
});

app.get("/metrics", async (req, res) => {
  const metrics = await getMetrics();
  res.status(200).json({
    status: "success",
    data: metrics,
  });
});
console.log("here");
app.use("/api", verifyRoutes);
app.use("/api", webHookRoutes);
app.use((err, req, res, next) => {
  console.error(err.stack);
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    status: "error",
    code: err.code || "SERVER_ERROR",
    message: err.message || "Internal Server Error",
  });
});

module.exports = app;
