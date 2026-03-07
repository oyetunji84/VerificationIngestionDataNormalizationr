const { getElasticsearchClient } = require("../config/elasticsearch");

const es = getElasticsearchClient();
async function indexLog(log) {
  await es.index({
    index: INDEX,
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
