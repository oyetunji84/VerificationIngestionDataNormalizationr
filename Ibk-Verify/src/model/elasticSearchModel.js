const elasticSchema = {
  index: "logs_verify",
  settings: {
    number_of_shards: 1,
    number_of_replicas: 0,
  },
  mappings: {
    dynamic: "strict",
    properties: {
      mongoId: { type: "keyword" },
      type: { type: "keyword" },
      searchId: { type: "keyword" },
      status: { type: "keyword" },
      provider: { type: "keyword" },
      companyId: { type: "keyword" },
      idempotencyKey: { type: "keyword" },
      retryCount: { type: "integer" },
      errorMessage: { type: "text" },
      responsePayload: {
        type: "flattened",
      },
      requestedAt: { type: "date" },
      completedAt: { type: "date" },
      createdAt: { type: "date" },
      updatedAt: { type: "date" },
      "@timestamp": { type: "date" },
    },
  },
};

module.exports = { elasticSchema };
