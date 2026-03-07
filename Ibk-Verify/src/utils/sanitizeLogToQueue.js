function serializePayload(payload) {
  if (payload == null) return null;

  try {
    return JSON.parse(JSON.stringify(payload));
  } catch (error) {
    console.error(
      "[formatLog] responsePayload serialization failed:",
      error.message,
    );
    return null;
  }
}

function formatLog(doc) {
  return {
    mongoId: doc._id.toString(),
    type: doc.type,
    searchId: doc.searchId,
    status: doc.status,
    provider: doc.provider,
    companyId: doc.companyId?.toString() ?? null,
    idempotencyKey: doc.idempotencyKey ?? null,
    retryCount: doc.retryCount,
    errorMessage: doc.errorMessage ?? null,
    responsePayload: serializePayload(doc.responsePayload),
    requestedAt: doc.requestedAt?.toISOString() ?? null,
    completedAt: doc.completedAt?.toISOString() ?? null,
    createdAt: doc.createdAt?.toISOString() ?? null,
    updatedAt: doc.updatedAt?.toISOString() ?? null,
  };
}

module.exports = { formatLog };

// Step 4 — Resilient publish
// The publish call inside both hooks must never crash the main flow. If RabbitMQ is down, the verification should still work — we catch and log the error silently.
// Step 5 — RabbitMQ publisher
// Write a clean publishToSearchQueue function with a persistent message, messageId for deduplication, and proper connection handling.
// Step 6 — Elasticsearch consumer
// Write the consumer that reads from the queue and appends to the verification-logs index — no id passed so ES auto-generates, giving one document per status change.
// Step 7 — ES index setup
// On consumer startup, ensure the index exists with the correct field mappings so Kibana can filter and sort properly.
