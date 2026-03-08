const {
  getElasticsearchClient,
  ensureelasticSchema,
} = require("../config/elasticsearch");
const {
  publishToSearchRetryQueue,
  SEARCH_INDEX_QUEUE,
  getChannel,
} = require("../config/rabbitmq");
const { elasticSchema } = require("../model/elasticSearchModel");

async function indexLog(log) {
  const es = getElasticsearchClient();
  await es.index({
    index: elasticSchema.index,
    document: {
      mongoId: log.mongoId,
      type: log.type,
      searchId: log.searchId,
      status: log.status,
      provider: log.provider,
      companyId: log.companyId,
      idempotencyKey: log.idempotencyKey,
      retryCount: log.retryCount,
      errorMessage: log.errorMessage,
      responsePayload: log.responsePayload,
      requestedAt: log.requestedAt,
      completedAt: log.completedAt,
      createdAt: log.createdAt,
      updatedAt: log.updatedAt,
      "@timestamp": new Date().toISOString(),
    },
  });
}
function getRetryCount(msg) {
  const xDeath = msg.properties.headers?.["x-death"];
  if (!xDeath || !Array.isArray(xDeath)) return 0;
  return xDeath.reduce((total, entry) => total + (entry.count || 0), 0);
}
async function handleFailure(channel, msg, log, error) {
  const retryCount = getRetryCount(msg);
  const nextAttempt = retryCount + 1;

  if (retryCount < MAX_RETRIES) {
    const delay = getRetryDelay(nextAttempt);

    console.warn(
      `[Consumer] Retry scheduled | mongoId: ${log.mongoId} | status: ${log.status} | attempt: ${nextAttempt}/${MAX_RETRIES} | delay: ${delay / 1000}s`,
    );

    publishToSearchRetryQueue(
      JSON.parse(msg.content.toString()), // data
      delay, // delayMs
      {
        headers: {
          ...msg.properties.headers, // preserve x-death history across retries
          "x-retry-count": nextAttempt,
          "x-last-error": error.message,
          "x-last-retry-at": new Date().toISOString(),
          "x-next-retry-in": `${delay / 1000}s`,
        },
      },
    );
  } else {
    console.error(
      `[Consumer] Max retries exceeded | mongoId: ${log.mongoId} | status: ${log.status} | sending to dead queue`,
    );
  }

  channel.ack(msg);
}

async function startElasticConsumer() {
  await ensureelasticSchema();

  const channel = getChannel();
  if (!channel) {
    console.error("RabbitMQ channel not available. Worker cannot start.");
    setTimeout(startElasticConsumer, 5000);
    return;
  }

  channel.prefetch(50);

  console.info("[Consumer] Waiting for verification logs...");

  channel.consume(SEARCH_INDEX_QUEUE, async (msg) => {
    if (!msg) return;

    let log;
    try {
      log = JSON.parse(msg.content.toString());
    } catch (parseError) {
      console.error("[Consumer] Unparseable message — routing to dead queue");
      return;
    }

    try {
      await indexLog(log);
      channel.ack(msg);
      console.info(
        `[Consumer] Indexed | mongoId: ${log.mongoId} | status: ${log.status}`,
      );
    } catch (error) {
      console.error(
        `[Consumer] Index failed | mongoId: ${log.mongoId} | status: ${log.status} | error: ${error.message}`,
      );
      await handleFailure(channel, msg, log, error);
    }
  });
}

module.exports = { startElasticConsumer };
