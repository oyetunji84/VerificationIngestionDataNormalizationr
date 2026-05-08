const Joi = require("joi");
require("dotenv").config("../.env");

const envSchema = Joi.object({
  GATEWAY_BASE_URL: Joi.string().uri(),
  ELASTICSEARCH_URL: Joi.string().uri(),
  INTERNAL_API_KEY: Joi.string().required(),

  OTEL_ENABLED: Joi.string().valid("true", "false").default("false"),
  OTEL_EXPORTER_OTLP_ENDPOINT: Joi.string().uri(),
  OTEL_SERVICE_NAME: Joi.string(),

  BILLING_SERVICE_URL: Joi.string().uri(),
  API_KEY_PEPPER: Joi.string().required(),
  WEBHOOK_SECRET: Joi.string().required(),
  NODE_ENV: Joi.string()
    .valid("development", "production", "test")
    .default("development"),
  RABBITMQ_URL: Joi.string().uri(),
  POSTGRES_URL: Joi.string().uri(),
  REDIS_URL: Joi.string().uri(),
  BASE_URL: Joi.string().uri(),
  API_KEY: Joi.string().required(),
  MONGO_URI: Joi.string().uri(),
}).unknown(true);

const { error, value: env } = envSchema.validate(process.env, {
  abortEarly: false,
});

if (error) {
  const vars = error.details.map((d) => d.context.key).join(", ");
  throw new Error(`Invalid environment variables: ${vars}`);
}

module.exports = {
  GATEWAY_BASE_URL: env.GATEWAY_BASE_URL,
  ELASTICSEARCH_URL: env.ELASTICSEARCH_URL,
  INTERNAL_API_KEY: env.INTERNAL_API_KEY,
  OTEL_ENABLED: env.OTEL_ENABLED,
  OTEL_EXPORTER_OTLP_ENDPOINT: env.OTEL_EXPORTER_OTLP_ENDPOINT,
  OTEL_SERVICE_NAME: env.OTEL_SERVICE_NAME,
  BILLING_SERVICE_URL: env.BILLING_SERVICE_URL,
  API_KEY_PEPPER: env.API_KEY_PEPPER,
  WEBHOOK_SECRET: env.WEBHOOK_SECRET,
  RABBITMQ_URL: env.RABBITMQ_URL,
  POSTGRES_URL: env.POSTGRES_URL,
  REDIS_URL: env.REDIS_URL,
  BASE_URL: env.BASE_URL,
  API_KEY: env.API_KEY,
  MONGO_URI: env.MONGO_URI,
  NODE_ENV: env.NODE_ENV,
};
