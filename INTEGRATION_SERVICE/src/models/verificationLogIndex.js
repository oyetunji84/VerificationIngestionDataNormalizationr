const verificationLogIndex = {
  index: "verification_logs_v1",
  settings: {
    number_of_shards: 1,
    number_of_replicas: 0,
  },
  mappings: {
    dynamic: "strict",
    properties: {
      apiKey: { type: "keyword" },
      requestId: { type: "keyword" },
      serviceType: { type: "keyword" },
      requestedAt: { type: "date" },
      status: { type: "keyword" },
      errorMessage: { type: "text" },
      errorCode: { type: "keyword" },
      amountInKobo: { type: "long" },
      walletTransactionId: { type: "keyword" },
      createdAt: { type: "date" },
      updatedAt: { type: "date" },
      traceId: { type: "keyword" },
      indexedAt: { type: "date" },
      searchText: { type: "text" },
    },
  },
};

module.exports = { verificationLogIndex };
