const {
  getElasticsearchClient,
  ensureVerificationLogIndex,
  verificationLogIndex,
} = require("../infra/elasticSearch");
const {
  searchHistoryIndex,
  aggregateHistoryIndex,
} = require("../utility/historyIndex.util");
const {
  publishVerificationIndexMain,
  publishHistoryReindexMain,
} = require("../worker/publisher");
const { createReindexJob, getReindexJob } = require("./reindexService");
const { toTraceHeaders } = require("../infra/traceContext");

const normalizeServiceType = (serviceType) => {
  if (serviceType === "LICENSE") return "DRIVERS_LICENSE";
  return serviceType;
};

const normalizeHistoryPayload = (logData = {}) => {
  const now = new Date();
  const requestedAt = logData.requestedAt ? new Date(logData.requestedAt) : now;
  const createdAt = logData.createdAt ? new Date(logData.createdAt) : now;
  const updatedAt = logData.updatedAt ? new Date(logData.updatedAt) : now;

  return {
    apiKey: logData.apiKey,
    requestId: logData.requestId || logData.idempotencyKey || null,
    serviceType: normalizeServiceType(logData.serviceType),
    status: logData.status,
    errorMessage: logData.errorMessage || null,
    errorCode: logData.errorCode || null,
    amountInKobo:
      logData.amountInKobo === undefined || logData.amountInKobo === null
        ? null
        : Number(logData.amountInKobo),
    walletTransactionId: logData.walletTransactionId
      ? String(logData.walletTransactionId)
      : null,
    requestedAt: requestedAt.toISOString(),
    createdAt: createdAt.toISOString(),
    updatedAt: updatedAt.toISOString(),
  };
};

const logVerification = async (logData, options = {}) => {
  try {
    const payload = normalizeHistoryPayload(logData);

    const traceHeaders = toTraceHeaders({
      traceId: options.traceId,
      traceparent: options.traceparent,
    });

    await publishVerificationIndexMain(payload, 0, traceHeaders);

    return {
      queued: true,
      requestId: payload.requestId,
      serviceType: payload.serviceType,
      status: payload.status,
    };
  } catch (error) {
    console.log("Failed to publish verification history event", {
      error: error.message,
      requestId: logData.requestId || logData.idempotencyKey,
    });
    return null;
  }
};

const ensureArray = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  return String(value)
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
};

async function runHistorySearch(params = {}) {
  const client = getElasticsearchClient();
  await ensureVerificationLogIndex();
  return searchHistoryIndex(client, verificationLogIndex.index, params);
}

const getHistoryByFilters = async (filters, pagination = {}) => {
  try {
    const params = {
      apiKey: filters.apiKey,
      requestId: filters.requestId,
      traceId: filters.traceId,
      serviceType: filters.serviceType ? [filters.serviceType] : [],
      status: filters.status ? [filters.status] : [],
      dateFrom: filters.startDate,
      dateTo: filters.endDate,
      page: Number(pagination.page || 1),
      size: Number(pagination.limit || 20),
      sortBy: "requestedAt",
      sortOrder: "desc",
    };

    const result = await runHistorySearch(params);

    const totalPages = Math.ceil(result.total / result.size);
    return {
      data: result.data,
      pagination: {
        page: result.page,
        limit: result.size,
        total: result.total,
        totalPages,
        hasNextPage: result.page < totalPages,
        hasPrevPage: result.page > 1,
      },
    };
  } catch (error) {
    console.log("Error fetching history", { error: error.message, filters });
    throw new Error(`Failed to fetch history: ${error.message}`);
  }
};

const searchHistory = async (params = {}) => {
  const normalized = {
    q: params.q,
    apiKey: params.apiKey,
    requestId: params.requestId,
    serviceType: ensureArray(params.serviceType),
    status: ensureArray(params.status),
    errorCode: ensureArray(params.errorCode),
    traceId: params.traceId,
    dateFrom: params.dateFrom,
    dateTo: params.dateTo,
    page: Number(params.page || 1),
    size: Number(params.size || 20),
    sortBy: params.sortBy || "requestedAt",
    sortOrder: params.sortOrder || "desc",
  };

  return runHistorySearch(normalized);
};

const aggregateHistory = async (params = {}) => {
  const normalized = {
    q: params.q,
    apiKey: params.apiKey,
    requestId: params.requestId,
    serviceType: ensureArray(params.serviceType),
    status: ensureArray(params.status),
    errorCode: ensureArray(params.errorCode),
    traceId: params.traceId,
    dateFrom: params.dateFrom,
    dateTo: params.dateTo,
  };

  const client = getElasticsearchClient();
  await ensureVerificationLogIndex();
  return aggregateHistoryIndex(client, verificationLogIndex.index, normalized);
};

const enqueueReindexJob = async (
  { filters = {}, batchSize = 200 } = {},
  options = {},
) => {
  const job = createReindexJob({ filters, batchSize });
  await publishHistoryReindexMain(
    {
      reindexJobId: job.id,
      filters,
      batchSize,
    },
    0,
    toTraceHeaders({
      traceId: options.traceId,
      traceparent: options.traceparent,
    }),
  );

  return job;
};

const getReindexStatus = async (jobId) => getReindexJob(jobId);

module.exports = {
  logVerification,
  getHistoryByFilters,
  searchHistory,
  aggregateHistory,
  enqueueReindexJob,
  getReindexStatus,
};
