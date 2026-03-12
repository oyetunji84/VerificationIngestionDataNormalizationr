const logger = require("../utils/logger");

const loggingInterceptor = (methodDescriptor, call) => {
  const method = methodDescriptor.path;         // e.g. /billing.v1.BillingService/ChargeWallet
  const start = Date.now();

  call.on("finish", () => {
    const duration = Date.now() - start;
    logger.info("gRPC call", {
      method,
      duration_ms: duration,
      status: call.status?.code ?? 0,
    });
  });

  return call;
};

module.exports = { loggingInterceptor };


cat > /home/claude/billing-service/src/interceptors/error.interceptor.js << 'EOF'
/**
 * error.interceptor.js
 *
 * Last-resort safety net. Catches any unhandled exception that escapes a handler
 * and converts it to a clean gRPC INTERNAL error instead of crashing the server.
 *
 * Without this, an unhandled throw would leave the client hanging with no response.
 */

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
EOF

cat > /home/claude/billing-service/src/interceptors/tracing.interceptor.js << 'EOF'
/**
 * tracing.interceptor.js
 *
 * NOTE: This interceptor is a placeholder for any MANUAL tracing concerns.
 *
 * In practice, @opentelemetry/instrumentation-grpc already handles:
 *  - Extracting traceparent from incoming gRPC metadata
 *  - Creating the server-side span automatically
 *  - Linking it as a child of the caller's span
 *
 * This file exists so that if you ever need to attach custom attributes to
 * the server span (e.g. companyId from metadata), you have a clean place to do it
 * without touching handler logic.
 */

const { trace, context } = require("@opentelemetry/api");

const tracingInterceptor = (methodDescriptor, call) => {
  // OTel auto-instrumentation has already extracted the trace context
  // and started the server span by the time interceptors run.
  // You can access the active span here if needed:
  //
  // const activeSpan = trace.getActiveSpan();
  // activeSpan?.setAttribute("billing.custom_attr", "value");

  return call;
};

module.exports = { tracingInterceptor };
EOF

cat > /home/claude/billing-service/src/interceptors/index.js << 'EOF'
/**
 * interceptors/index.js
 *
 * Exports the ordered interceptor chain for the gRPC server.
 * Order matters — they execute top to bottom on every call:
 *
 *  1. tracing   → context is available for everything below
 *  2. logging   → captures timing and status for every call
 *  3. error     → safety net that catches anything that slips through
 *
 * To add a new interceptor (e.g. auth when you add mTLS):
 *  1. Create auth.interceptor.js in this folder
 *  2. Import it here and add it to the array
 */

const { tracingInterceptor } = require("./tracing.interceptor");
const { loggingInterceptor } = require("./logging.interceptor");
const { errorInterceptor } = require("./error.interceptor");

const interceptors = [
  tracingInterceptor,
  loggingInterceptor,
  errorInterceptor,
];

module.exports = interceptors;
EOF
