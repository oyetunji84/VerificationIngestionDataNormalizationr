const { getChannel } = require("../infra/rabbitmq");
const { TOPOLOGY } = require("../infra/setUpQueue");
const { publishRetry } = require("./publisher");
const HttpClient = require("../../utility/httpClient");
const { AppError } = require("../../utility/error");
const jobRepository = require("../repository/jobRepository");

let trace;
let SpanStatusCode;
try {
  ({ trace, SpanStatusCode } = require("@opentelemetry/api"));
} catch (error) {
  trace = {
    getTracer: () => ({
      startSpan: () => ({
        end() {},
        setStatus() {},
        recordException() {},
      }),
    }),
  };
  SpanStatusCode = { ERROR: 2 };
}

const tracer = trace.getTracer("integration-service.rabbitmq");

const externalClient = new HttpClient(process.env.EXTERNAL_API_URL, {
  retries: 0,
  providerName: "ExternalJobAPI",
});

async function processJob(payload, route, idempotencyKey) {
  return externalClient.post(route, payload, {
    idempotencyKey,
  });
}

async function startConsumer() {
  const channel = await getChannel();
  channel.prefetch(20);
  console.log("[Consumer] waiting for jobs...");

  channel.consume(TOPOLOGY.JOB.QUEUES.MAIN, async (msg) => {
    if (!msg) return;
    const consumeSpan = tracer.startSpan("rabbitmq.consume", {
      attributes: {
        "messaging.system": "rabbitmq",
        "messaging.destination": TOPOLOGY.JOB.QUEUES.MAIN,
      },
    });

    let jobId;
    let payload;
    let retryCount;
    let idempotencyKey;
    let route;

    try {
      ({ jobId, payload, retryCount, idempotencyKey, route } = JSON.parse(
        msg.content.toString(),
      ));
    } catch (e) {
      console.log("[Consumer] failed to parse message - dead lettering");
      channel.nack(msg, false, false);
      consumeSpan.end();
      return;
    }

    const effectiveRoute = route || payload?.route;
    if (!effectiveRoute) {
      console.log(`[Consumer] no route for job ${jobId} - dead lettering`);
      channel.nack(msg, false, false);
      consumeSpan.end();
      return;
    }

    const job = await jobRepository.findById(jobId);
    if (!job) {
      console.log(`[Consumer] job ${jobId} not found - discarding`);
      channel.ack(msg);
      consumeSpan.end();
      return;
    }

    if (job.status === "success") {
      console.log(
        `[Consumer] job ${jobId} already succeeded - discarding duplicate`,
      );
      channel.ack(msg);
      consumeSpan.end();
      return;
    }

    await jobRepository.updateById(jobId, {
      status: "processing",
      retry_count: retryCount,
    });

    try {
      const result = await processJob(payload, effectiveRoute, idempotencyKey);

      await jobRepository.updateById(jobId, {
        status: "success",
        result,
      });

      console.log(`[✓] job ${jobId} succeeded`);
      channel.ack(msg);
      consumeSpan.end();
    } catch (error) {
      consumeSpan.recordException(error);
      consumeSpan.setStatus({ code: SpanStatusCode.ERROR, message: error.message });
      const retryable = !(error instanceof AppError) || error.retryable;
      const exhausted = retryCount >= TOPOLOGY.MAX_RETRIES;

      console.error(
        `[Consumer] job ${jobId} failed (retry ${retryCount}/${TOPOLOGY.MAX_RETRIES}):`,
        error.message,
      );

      if (!retryable || exhausted) {
        channel.nack(msg, false, false);
      } else {
        await publishRetry(
          jobId,
          payload,
          retryCount + 1,
          idempotencyKey,
          effectiveRoute,
          msg.properties?.headers || {},
        );
        channel.ack(msg);
      }
      consumeSpan.end();
    }
  });
}

module.exports = { startConsumer };
