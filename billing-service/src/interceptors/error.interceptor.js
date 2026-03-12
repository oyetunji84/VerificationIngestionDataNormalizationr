const grpc = require("@grpc/grpc-js");
const logger = require("../utils/logger");

const errorInterceptor = (methodDescriptor, call) => {
  const originalSendStatus = call.sendStatus?.bind(call);

  if (originalSendStatus) {
    call.sendStatus = (status) => {
      if (status.code !== grpc.status.OK) {
        logger.error("gRPC call failed", {
          method: methodDescriptor.path,
          code: status.code,
          message: status.details,
        });
      }
      return originalSendStatus(status);
    };
  }

  return call;
};

module.exports = { errorInterceptor };
