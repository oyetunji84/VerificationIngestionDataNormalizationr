require("dotenv").config("../../.env");
const required = (key) => {
  const value = process.env[key];
  if (!value) throw new Error(`Missing required environment variable: ${key}`);
  return value;
};

const optional = (key, fallback) => process.env[key] ?? fallback;

console.log(process.env);
module.exports = {
  NODE_ENV: optional("NODE_ENV", "development"),
  IS_PRODUCTION: process.env.NODE_ENV === "production",

  grpc: {
    port: optional("GRPC_PORT", "50051"),
  },

  db: {
    host: optional("DB_HOST", "localhost"),
    port: optional("DB_PORT", "5432"),
    name: optional("DB_NAME", "billing_db"),
    user: optional("DB_USER", "postgres"),
    password: optional("DB_PASSWORD", "postgres"),
  },

  redis: {
    host: optional("REDIS_HOST", "localhost"),
    port: optional("REDIS_PORT", "6379"),
    password: optional("REDIS_PASSWORD", undefined),
  },

  otel: {
    serviceName: optional("OTEL_SERVICE_NAME", "billing-service"),
    exporterEndpoint: optional(
      "OTEL_EXPORTER_OTLP_ENDPOINT",
      "http://localhost:4318",
    ),
  },
};
