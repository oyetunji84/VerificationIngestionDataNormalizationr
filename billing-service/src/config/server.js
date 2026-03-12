const grpc = require("@grpc/grpc-js");
const protoLoader = require("@grpc/proto-loader");
const path = require("path");
const env = require("./env");
const logger = require("../utils/logger");

const PROTO_PATH = path.join(__dirname, "../proto/billing/v1/billing.proto");
logger.info(PROTO_PATH);
const loadProto = () => {
  const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
    keepCase: true, // preserves field names as written in .proto
    longs: String, // serializes int64 as strings (safe for JS)
    enums: String, // serializes enums as string names
    defaults: true, // populates default values on missing fields
    oneofs: true, // correctly handles oneof fields
  });
  return grpc.loadPackageDefinition(packageDefinition);
};

const createServer = (handlers, interceptors = []) => {
  const server = new grpc.Server({});

  const proto = loadProto();
  const { BillingService } = proto.billing.v1;

  server.addService(BillingService.service, handlers);

  return server;
};

const startServer = (server) => {
  return new Promise((resolve, reject) => {
    const address = `0.0.0.0:${env.grpc.port}`;
    server.bindAsync(
      address,
      grpc.ServerCredentials.createInsecure(),
      (err, port) => {
        // createInsecure() → no TLS for local dev
        // When ready for production: swap with grpc.ServerCredentials.createSsl(...)
        if (err) return reject(err);
        logger.info(
          `Billing gRPC server listening on port http://localhost:${port}`,
        );
        resolve(port);
      },
    );
  });
};

module.exports = { createServer, startServer };
