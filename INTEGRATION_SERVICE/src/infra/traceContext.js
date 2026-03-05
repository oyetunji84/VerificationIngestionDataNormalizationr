const crypto = require("crypto");

function generateTraceId() {
  return crypto.randomBytes(16).toString("hex");
}

function generateSpanId() {
  return crypto.randomBytes(8).toString("hex");
}

function parseTraceparent(traceparent) {
  if (!traceparent || typeof traceparent !== "string") return null;
  const parts = traceparent.split("-");
  if (parts.length !== 4) return null;
  return { traceId: parts[1], spanId: parts[2] };
}

function buildTraceContextFromHeaders(headers = {}) {
  const traceparent = headers.traceparent || headers.Traceparent;
  const parsed = parseTraceparent(traceparent);
  const traceId =
    headers["x-trace-id"] ||
    headers["X-Trace-Id"] ||
    parsed?.traceId ||
    generateTraceId();

  return {
    traceId,
    spanId: generateSpanId(),
    traceparent: `00-${traceId}-${generateSpanId()}-01`,
  };
}

function toTraceHeaders(traceContext = {}) {
  const traceId = traceContext.traceId || generateTraceId();
  const traceparent =
    traceContext.traceparent || `00-${traceId}-${generateSpanId()}-01`;

  return {
    "x-trace-id": traceId,
    traceparent,
  };
}

function getTraceIdFromAmqpHeaders(headers = {}) {
  return (
    headers["x-trace-id"] ||
    headers["X-Trace-Id"] ||
    parseTraceparent(headers.traceparent)?.traceId ||
    null
  );
}

module.exports = {
  buildTraceContextFromHeaders,
  toTraceHeaders,
  getTraceIdFromAmqpHeaders,
};
