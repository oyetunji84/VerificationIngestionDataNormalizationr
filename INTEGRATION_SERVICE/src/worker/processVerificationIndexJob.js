const { getChannel } = require("../infra/rabbitmq");
const { TOPOLOGY } = require("../infra/setUpQueue");
const { publishVerificationIndexRetry } = require("./publisher");
const {
  getElasticsearchClient,
  ensureVerificationLogIndex,
  verificationLogIndex,
} = require("../infra/elasticSearch");
const { upsertHistoryLog } = require("../utility/historyIndex.util");
const { getTraceIdFromAmqpHeaders } = require("../infra/traceContext");

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

async function startVerificationIndexConsumer() {
  const channel = await getChannel();

  channel.prefetch(20);
  console.log("[VerificationIndexConsumer] waiting for index events...");

  channel.consume(TOPOLOGY.VERIFICATION_INDEX.QUEUES.MAIN, async (msg) => {
    if (!msg) return;

    const consumeSpan = tracer.startSpan("rabbitmq.consume", {
      attributes: {
        "messaging.system": "rabbitmq",
        "messaging.destination": TOPOLOGY.VERIFICATION_INDEX.QUEUES.MAIN,
      },
    });

    let envelope;
    try {
      envelope = JSON.parse(msg.content.toString());
    } catch (error) {
      console.log("[VerificationIndexConsumer] invalid payload", error.message);
      channel.nack(msg, false, false);
      consumeSpan.end();
      return;
    }

    const retryCount = Number(envelope.retryCount || 0);
    const payload = envelope.payload || {};
    const headers = msg.properties?.headers || {};

    try {
      const traceId = getTraceIdFromAmqpHeaders(headers);
      const client = getElasticsearchClient();
      await ensureVerificationLogIndex();
      await upsertHistoryLog(
        client,
        verificationLogIndex.index,
        payload,
        traceId,
      );
      channel.ack(msg);
    } catch (error) {
      consumeSpan.recordException(error);
      consumeSpan.setStatus({ code: SpanStatusCode.ERROR, message: error.message });

      const exhausted = retryCount >= TOPOLOGY.MAX_RETRIES;
      if (exhausted) {
        channel.nack(msg, false, false);
      } else {
        await publishVerificationIndexRetry(payload, retryCount + 1, headers);
        channel.ack(msg);
      }
    } finally {
      consumeSpan.end();
    }
  });
}

module.exports = { startVerificationIndexConsumer };
