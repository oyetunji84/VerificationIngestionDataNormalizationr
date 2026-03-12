/**
 * Usage:
 *   const result = await withSpan(tracer, "billing.charge_wallet", { "billing.org": companyId }, async () => {
 *     return await doWork();
 *   });
 */

const { SpanStatusCode } = require("@opentelemetry/api");

const withSpan = async (tracer, name, attributes = {}, fn) => {
  const span = tracer.startSpan(name, { attributes });
  try {
    const result = await fn(span);
    span.setStatus({ code: SpanStatusCode.OK });
    return result;
  } catch (error) {
    span.recordException(error);
    span.setStatus({ code: SpanStatusCode.ERROR, message: error.message });
    throw error;
  } finally {
    span.end();
  }
};

module.exports = { withSpan };
