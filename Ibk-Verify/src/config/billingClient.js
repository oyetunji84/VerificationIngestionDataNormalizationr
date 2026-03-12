const grpc = require("@grpc/grpc-js");
const protoLoader = require("@grpc/proto-loader");
const path = require("path");
const PROTO_PATH_1 = path.join(__dirname);
const PROTO_PATH = path.join(__dirname, "../proto/billing/v1/billing.proto");
console.log(PROTO_PATH, PROTO_PATH_1);
const BILLING_SERVICE_URL =
  process.env.BILLING_SERVICE_URL || "localhost:50051";

const STARTUP_CONNECT_TIMEOUT_MS = 10_000;

let client = null;

const loadServiceDefinition = () => {
  const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true,
  });
  const proto = grpc.loadPackageDefinition(packageDefinition);
  return proto.billing.v1.BillingService;
};

const initBillingClient = async () => {
  if (client) return client;

  const BillingService = loadServiceDefinition();

  client = new BillingService(
    BILLING_SERVICE_URL,
    grpc.credentials.createInsecure(),
    {
      "grpc.keepalive_time_ms": 30_000, // send ping every 30s
      "grpc.keepalive_timeout_ms": 10_000, // wait 10s for pong before closing
      "grpc.keepalive_permit_without_calls": 1, // allow pings even with no active RPCs
      "grpc.http2.max_pings_without_data": 0, // no limit on pings
    },
  );

  await new Promise((resolve, reject) => {
    const deadline = Date.now() + STARTUP_CONNECT_TIMEOUT_MS;
    client.waitForReady(deadline, (err) => {
      if (err) {
        return reject(
          new Error(
            `Billing service unreachable at ${BILLING_SERVICE_URL} ` +
              `within ${STARTUP_CONNECT_TIMEOUT_MS}ms: ${err.message}`,
          ),
        );
      }
      resolve();
    });
  });

  console.log(
    `[billingClient] Connected to billing service at ${BILLING_SERVICE_URL}`,
  );
  return client;
};

const getBillingClient = () => {
  if (!client) {
    throw new Error(
      "Billing gRPC client not initialised. " +
        "Call initBillingClient() during app startup before consuming jobs.",
    );
  }
  return client;
};

module.exports = { initBillingClient, getBillingClient };
