const Joi = require("joi");
require("dotenv").config("../../.env");

const envSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid("development", "production", "test")
    .default("development"),

  GRPC_PORT: Joi.string().default("50051"),

  DB_HOST: Joi.string().default("localhost"),
  DB_PORT: Joi.string().default("5432"),
  DB_NAME: Joi.string().default("billing_db"),
  DB_USER: Joi.string().default("postgres"),
  DB_PASSWORD: Joi.string().default("postgres"),

  REDIS_HOST: Joi.string().default("localhost"),
  REDIS_PORT: Joi.string().default("6379"),
  REDIS_PASSWORD: Joi.string().optional(),

  OTEL_SERVICE_NAME: Joi.string().default("billing-service"),
  OTEL_EXPORTER_OTLP_ENDPOINT: Joi.string()
    .uri()
    .default("http://localhost:4318"),
}).unknown(true);

const { error, value: env } = envSchema.validate(process.env, {
  abortEarly: false,
});

if (error) {
  const vars = error.details.map((d) => d.context.key).join(", ");
  throw new Error(`Invalid environment variables: ${vars}`);
}

module.exports = {
  NODE_ENV: env.NODE_ENV,
  IS_PRODUCTION: env.NODE_ENV === "production",

  grpc: {
    port: env.GRPC_PORT,
  },

  db: {
    host: env.DB_HOST,
    port: env.DB_PORT,
    name: env.DB_NAME,
    user: env.DB_USER,
    password: env.DB_PASSWORD,
  },

  redis: {
    host: env.REDIS_HOST,
    port: env.REDIS_PORT,
    password: env.REDIS_PASSWORD,
  },

  otel: {
    serviceName: env.OTEL_SERVICE_NAME,
    exporterEndpoint: env.OTEL_EXPORTER_OTLP_ENDPOINT,
  },
};
