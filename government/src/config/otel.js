const { NodeSDK } = require("@opentelemetry/sdk-node");
const {
  getNodeAutoInstrumentations,
} = require("@opentelemetry/auto-instrumentations-node");
const {
  OTLPTraceExporter,
} = require("@opentelemetry/exporter-trace-otlp-grpc");
const { resourceFromAttributes } = require("@opentelemetry/resources");
const { ATTR_SERVICE_NAME } = require("@opentelemetry/semantic-conventions");

const exporter = new OTLPTraceExporter({
  url: process.env.OTEL_EXPORTER_OTLP_ENDPOINT || "http://localhost:4317",
});

const sdk = new NodeSDK({
  resource: resourceFromAttributes({
    [ATTR_SERVICE_NAME]: process.env.SERVICE_NAME || "gov-provider",
  }),
  traceExporter: exporter,
  instrumentations: [getNodeAutoInstrumentations()],
});

Promise.resolve(sdk.start()).catch((error) => {
  console.error("OpenTelemetry initialization failed:", error);
});

const shutdown = (signal) => {
  sdk
    .shutdown()
    .then(() => {
      console.log(`OpenTelemetry shut down successfully (${signal})`);
      process.exit(0);
    })
    .catch((error) => {
      console.error("OpenTelemetry shutdown failed:", error);
      process.exit(1);
    });
};

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
