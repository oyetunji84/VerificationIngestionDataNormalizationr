const { NodeSDK } = require("@opentelemetry/sdk-node");
const {
  getNodeAutoInstrumentations,
} = require("@opentelemetry/auto-instrumentations-node");
const {
  OTLPTraceExporter,
} = require("@opentelemetry/exporter-trace-otlp-grpc");
const { resourceFromAttributes } = require("@opentelemetry/resources");
const {
  SemanticResourceAttributes,
} = require("@opentelemetry/semantic-conventions");

if (process.env.OTEL_ENABLED === "false") {
  module.exports = {};
  return;
}

const exporter = new OTLPTraceExporter({
  url: process.env.OTEL_EXPORTER_OTLP_ENDPOINT || "http://localhost:4317",
});

const sdk = new NodeSDK({
  resource: resourceFromAttributes({
    [SemanticResourceAttributes.SERVICE_NAME]:
      process.env.OTEL_SERVICE_NAME || "verification-gateway",
  }),
  traceExporter: exporter,
  instrumentations: [getNodeAutoInstrumentations()],
});

Promise.resolve(sdk.start()).catch((error) => {
  console.error("OpenTelemetry initialization failed:", error);
});

process.on("SIGTERM", () => {
  sdk.shutdown().catch((error) => {
    console.error("OpenTelemetry shutdown failed:", error);
  });
});

module.exports = { sdk };
