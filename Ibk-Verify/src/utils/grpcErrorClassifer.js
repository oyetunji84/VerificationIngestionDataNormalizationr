const grpc = require("@grpc/grpc-js");

const TERMINAL = "TERMINAL";
const RETRIABLE = "RETRIABLE";

const TERMINAL_CODES = new Set([
  grpc.status.INVALID_ARGUMENT,
  grpc.status.NOT_FOUND,
  grpc.status.PERMISSION_DENIED,
  grpc.status.FAILED_PRECONDITION,
  grpc.status.UNIMPLEMENTED,
  grpc.status.DATA_LOSS,
]);

const RETRIABLE_CODES = new Set([
  grpc.status.DEADLINE_EXCEEDED,
  grpc.status.RESOURCE_EXHAUSTED,
  grpc.status.ABORTED,
  grpc.status.INTERNAL,
  grpc.status.UNAVAILABLE,
]);

const classifyGrpcError = (error) => {
  if (error.grpcCode === undefined || error.grpcCode === null) {
    return {
      classification: RETRIABLE,
      shouldRefund: false,
      reason: `Non-gRPC error: ${error.message}`,
    };
  }

  if (TERMINAL_CODES.has(error.grpcCode)) {
    return {
      classification: TERMINAL,
      shouldRefund: false,
      reason: `Terminal gRPC error [${error.grpcCode}]: ${error.grpcMessage || error.message}`,
    };
  }

  if (RETRIABLE_CODES.has(error.grpcCode)) {
    return {
      classification: RETRIABLE,
      shouldRefund: false,
      reason: `Retriable gRPC error [${error.grpcCode}]: ${error.grpcMessage || error.message}`,
    };
  }

  return {
    classification: RETRIABLE,
    shouldRefund: false,
    reason: `Unknown gRPC code [${error.grpcCode}]: ${error.grpcMessage || error.message}`,
  };
};

const isTerminal = (error) =>
  classifyGrpcError(error).classification === TERMINAL;
const isRetriable = (error) =>
  classifyGrpcError(error).classification === RETRIABLE;

const getRetryDelayMs = (error, retryCount) => {
  if (error.grpcCode === grpc.status.UNAVAILABLE) {
    return Math.min(Math.pow(2, retryCount) * 5_000, 80_000);
  }
  return Math.pow(2, retryCount) * 1_000;
};

module.exports = {
  classifyGrpcError,
  isTerminal,
  isRetriable,
  getRetryDelayMs,
  TERMINAL,
  RETRIABLE,
};
