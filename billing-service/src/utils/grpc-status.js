/**
 * grpc-status.js
 *
 * Maps domain errors to correct gRPC status codes.
 * Centralises all error translation in one place — handlers never
 * call callback(error) directly, they always go through here.
 *
 * gRPC status code semantics used in billing:
 *  NOT_FOUND          → wallet doesn't exist
 *  FAILED_PRECONDITION → wallet suspended or insufficient funds (business rule violation)
 *  INVALID_ARGUMENT   → unknown service type / bad input
 *  ALREADY_EXISTS     → idempotency: operation already completed (informational, not an error)
 *  INTERNAL           → unexpected server error
 */

const grpc = require("@grpc/grpc-js");

const DOMAIN_ERROR_MAP = {
  WALLET_NOT_FOUND: grpc.status.NOT_FOUND,
  INSUFFICIENT_FUNDS: grpc.status.FAILED_PRECONDITION,
  WALLET_SUSPENDED: grpc.status.FAILED_PRECONDITION,
  INVALID_SERVICE: grpc.status.INVALID_ARGUMENT,
};

/**
 * Converts a domain error code into a gRPC ServiceError and calls the callback.
 * Always use this in handlers instead of calling callback(error) directly.
 */
const replyWithError = (callback, code, message) => {
  const grpcCode = DOMAIN_ERROR_MAP[code] ?? grpc.status.INTERNAL;
  callback({ code: grpcCode, message });
};

const replyWithInternalError = (callback, error) => {
  callback({ code: grpc.status.INTERNAL, message: error.message });
};

module.exports = { replyWithError, replyWithInternalError };
