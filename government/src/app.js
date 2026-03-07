const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const routes = require("../src/route/govRouter");
require("../src/config/otel");
const app = express();

app.use(helmet());
app.use(cors());
app.use(morgan("dev"));
app.use(express.json());

app.get("/health", (req, res) => {
  res.status(200).json({ status: "UP", service: "Gov Provider" });
});

app.use("/api", routes);

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
