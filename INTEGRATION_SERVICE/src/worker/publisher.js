const { getChannel } = require("../infra/rabbitmq");
const { TOPOLOGY } = require("../infra/setUpQueue");

let trace;
let SpanStatusCode;
try {
  ({ trace, SpanStatusCode } = require("@opentelemetry/api"));
} catch (error) {
  trace = {
    getTracer: () => ({
      startSpan: () => ({
        end() {},
        setAttribute() {},
        setStatus() {},
        recordException() {},
      }),
    }),
  };
  SpanStatusCode = { ERROR: 2 };
}

const tracer = trace.getTracer("integration-service.rabbitmq");

const computeBackoff = (retryCount) =>
  TOPOLOGY.RETRY_BASE_DELAY_MS * Math.pow(2, retryCount);

function publishWithConfirm(exchange, routingKey, content, options = {}) {
  return new Promise(async (resolve, reject) => {
    const channel = await getChannel();

    const bufferHasRoom = channel.publish(
      exchange,
      routingKey,
      Buffer.from(content),
      { persistent: true, contentType: "application/json", ...options },
      (err) => {
        if (err) {
          console.error("[AMQP] publish error", err);
          return reject(new Error(`Broker rejected message: ${err.message}`));
        }
        resolve();
      },
    );

    if (!bufferHasRoom) {
      console.log("[AMQP] write buffer full - waiting for drain");
      channel.once("drain", () => {
        console.log("[AMQP] buffer drained - publishing can continue");
      });
    }
  });
}

async function publishToDomain(
  domain,
  routingKey,
  message,
  messageId,
  retryCount,
  headers = {},
) {
  const span = tracer.startSpan("rabbitmq.publish", {
    attributes: {
      "messaging.system": "rabbitmq",
      "messaging.destination": domain.QUEUES.MAIN,
      "messaging.rabbitmq.routing_key": routingKey,
      "messaging.message.id": String(messageId || ""),
      "messaging.message.retry_count": Number(retryCount || 0),
    },
  });

  try {
    await publishWithConfirm(domain.EXCHANGE, routingKey, message, {
      messageId,
      headers,
    });
  } catch (error) {
    span.recordException(error);
    span.setStatus({ code: SpanStatusCode.ERROR, message: error.message });
    throw error;
  } finally {
    span.end();
  }
}

async function publishJob(jobId, payload, retryCount = 0, headers = {}) {
  const message = JSON.stringify({
    jobId,
    payload,
    retryCount,
    idempotencyKey: payload.idempotencyKey,
    route: payload.route,
  });

  await publishToDomain(
    TOPOLOGY.JOB,
    TOPOLOGY.JOB.ROUTING_KEYS.MAIN,
    message,
    jobId,
    retryCount,
    headers,
  );

  console.log(`[✓] jobId=${jobId} broker confirmed in main queue`);
}

async function publishRetry(
  jobId,
  payload,
  retryCount,
  idempotencyKey,
  route,
  headers = {},
) {
  const backoffMs = computeBackoff(retryCount);
  const message = JSON.stringify({
    jobId,
    payload,
    retryCount,
    idempotencyKey,
    route,
  });

  await publishWithConfirm(
    TOPOLOGY.JOB.EXCHANGE,
    TOPOLOGY.JOB.ROUTING_KEYS.RETRY,
    message,
    {
      messageId: `${jobId}-retry-${retryCount}`,
      expiration: String(backoffMs),
      headers,
    },
  );

  console.log(
    `[✓] jobId=${jobId} retry #${retryCount} confirmed (backoff ${backoffMs}ms)`,
  );
}

async function publishVerificationIndexMain(payload, retryCount = 0, headers = {}) {
  const requestId = payload.requestId || `history-${Date.now()}`;
  const message = JSON.stringify({ payload, retryCount });

  await publishToDomain(
    TOPOLOGY.VERIFICATION_INDEX,
    TOPOLOGY.VERIFICATION_INDEX.ROUTING_KEYS.MAIN,
    message,
    requestId,
    retryCount,
    headers,
  );
}

async function publishVerificationIndexRetry(
  payload,
  retryCount,
  headers = {},
) {
  const requestId = payload.requestId || `history-${Date.now()}`;
  const backoffMs = computeBackoff(retryCount);
  const message = JSON.stringify({ payload, retryCount });

  await publishWithConfirm(
    TOPOLOGY.VERIFICATION_INDEX.EXCHANGE,
    TOPOLOGY.VERIFICATION_INDEX.ROUTING_KEYS.RETRY,
    message,
    {
      messageId: `${requestId}-retry-${retryCount}`,
      expiration: String(backoffMs),
      headers,
    },
  );
}

async function publishHistoryReindexMain(payload, retryCount = 0, headers = {}) {
  const id = payload.reindexJobId || `reindex-${Date.now()}`;

  await publishToDomain(
    TOPOLOGY.REINDEX,
    TOPOLOGY.REINDEX.ROUTING_KEYS.MAIN,
    JSON.stringify({ payload, retryCount }),
    id,
    retryCount,
    headers,
  );
}

async function publishHistoryReindexRetry(payload, retryCount = 0, headers = {}) {
  const id = payload.reindexJobId || `reindex-${Date.now()}`;
  const backoffMs = computeBackoff(retryCount);

  await publishWithConfirm(
    TOPOLOGY.REINDEX.EXCHANGE,
    TOPOLOGY.REINDEX.ROUTING_KEYS.RETRY,
    JSON.stringify({ payload, retryCount }),
    {
      messageId: `${id}-retry-${retryCount}`,
      expiration: String(backoffMs),
      headers,
    },
  );
}

module.exports = {
  publishJob,
  publishRetry,
  publishVerificationIndexMain,
  publishVerificationIndexRetry,
  publishHistoryReindexMain,
  publishHistoryReindexRetry,
};
