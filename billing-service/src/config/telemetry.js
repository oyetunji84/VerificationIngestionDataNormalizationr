const { NodeSDK } = require("@opentelemetry/sdk-node");
const {
  OTLPTraceExporter,
} = require("@opentelemetry/exporter-trace-otlp-http");
const { resourceFromAttributes } = require("@opentelemetry/resources");
const { ATTR_SERVICE_NAME } = require("@opentelemetry/semantic-conventions");
const {
  ATTR_DEPLOYMENT_ENVIRONMENT_NAME,
} = require("@opentelemetry/semantic-conventions/incubating");
const { GrpcInstrumentation } = require("@opentelemetry/instrumentation-grpc");
const { PgInstrumentation } = require("@opentelemetry/instrumentation-pg");
const {
  IORedisInstrumentation,
} = require("@opentelemetry/instrumentation-ioredis");
const env = require("./env");

const initTelemetry = () => {
  const exporter = new OTLPTraceExporter({
    url: `${env.otel.exporterEndpoint}/v1/traces`,
  });

  const sdk = new NodeSDK({
    resource: resourceFromAttributes({
      [ATTR_SERVICE_NAME]: env.otel.serviceName,
      [ATTR_DEPLOYMENT_ENVIRONMENT_NAME]: env.NODE_ENV,
    }),
    traceExporter: exporter,
    instrumentations: [
      new GrpcInstrumentation(),
      new PgInstrumentation(),
      new IORedisInstrumentation(),
    ],
  });

  sdk.start();

  process.on("SIGTERM", () => sdk.shutdown());
  process.on("SIGINT", () => sdk.shutdown());
};

module.exports = { initTelemetry };
