const crypto = require("crypto");

function normalizeHistoryDocument(payload = {}, traceId = null) {
  const requestedAt = payload.requestedAt
    ? new Date(payload.requestedAt)
    : new Date();
  const createdAt = payload.createdAt ? new Date(payload.createdAt) : new Date();
  const updatedAt = payload.updatedAt ? new Date(payload.updatedAt) : new Date();

  return {
    apiKey: String(payload.apiKey || ""),
    requestId: payload.requestId ? String(payload.requestId) : null,
    serviceType: payload.serviceType ? String(payload.serviceType) : null,
    requestedAt: requestedAt.toISOString(),
    status: payload.status ? String(payload.status) : null,
    errorMessage: payload.errorMessage ? String(payload.errorMessage) : null,
    errorCode: payload.errorCode ? String(payload.errorCode) : null,
    amountInKobo:
      payload.amountInKobo === undefined || payload.amountInKobo === null
        ? null
        : Number(payload.amountInKobo),
    walletTransactionId: payload.walletTransactionId
      ? String(payload.walletTransactionId)
      : null,
    createdAt: createdAt.toISOString(),
    updatedAt: updatedAt.toISOString(),
    traceId: traceId ? String(traceId) : null,
    indexedAt: new Date().toISOString(),
    searchText: [
      payload.requestId,
      payload.serviceType,
      payload.status,
      payload.errorMessage,
      payload.errorCode,
      payload.amountInKobo,
      payload.walletTransactionId,
      traceId,
    ]
      .filter(Boolean)
      .join(" "),
  };
}

function buildDocumentId(payload = {}) {
  if (payload.requestId) return String(payload.requestId);

  const fallback = `${payload.apiKey || ""}|${payload.serviceType || ""}|${
    payload.requestedAt || ""
  }|${payload.status || ""}|${payload.errorCode || ""}`;

  return crypto.createHash("sha256").update(fallback).digest("hex");
}

async function upsertHistoryLog(client, indexName, payload, traceId = null) {
  const id = buildDocumentId(payload);
  const doc = normalizeHistoryDocument(payload, traceId);

  await client.update({
    index: indexName,
    id,
    doc,
    doc_as_upsert: true,
    retry_on_conflict: 3,
  });

  return { id, doc };
}

function buildSearchQuery(params = {}) {
  const must = [];
  const filter = [];

  const {
    q,
    apiKey,
    requestId,
    serviceType,
    status,
    errorCode,
    traceId,
    dateFrom,
    dateTo,
    page = 1,
    size = 20,
    sortBy = "requestedAt",
    sortOrder = "desc",
  } = params;

  if (q) {
    must.push({
      multi_match: {
        query: q,
        fields: ["searchText", "errorMessage", "requestId", "traceId"],
      },
    });
  }

  if (apiKey) filter.push({ term: { apiKey } });
  if (requestId) filter.push({ term: { requestId } });
  if (traceId) filter.push({ term: { traceId } });
  if (serviceType?.length) filter.push({ terms: { serviceType } });
  if (status?.length) filter.push({ terms: { status } });
  if (errorCode?.length) filter.push({ terms: { errorCode } });

  if (dateFrom || dateTo) {
    filter.push({
      range: {
        requestedAt: {
          ...(dateFrom ? { gte: dateFrom } : {}),
          ...(dateTo ? { lte: dateTo } : {}),
        },
      },
    });
  }

  return {
    from: (Number(page) - 1) * Number(size),
    size: Number(size),
    sort: [{ [sortBy]: { order: sortOrder } }, { _id: { order: "asc" } }],
    query: {
      bool: {
        ...(must.length ? { must } : { must: [{ match_all: {} }] }),
        ...(filter.length ? { filter } : {}),
      },
    },
  };
}

async function searchHistoryIndex(client, indexName, params = {}) {
  const body = buildSearchQuery(params);

  const result = await client.search({
    index: indexName,
    ...body,
  });

  const hits = result?.hits?.hits || [];
  const total = result?.hits?.total?.value || 0;

  return {
    total,
    page: Number(params.page || 1),
    size: Number(params.size || 20),
    data: hits.map((hit) => hit._source),
  };
}

async function aggregateHistoryIndex(client, indexName, params = {}) {
  const base = buildSearchQuery({ ...params, page: 1, size: 0 });

  const result = await client.search({
    index: indexName,
    size: 0,
    query: base.query,
    aggs: {
      byServiceType: { terms: { field: "serviceType", size: 20 } },
      byStatus: { terms: { field: "status", size: 20 } },
      byErrorCode: { terms: { field: "errorCode", size: 20 } },
      byTraceId: { terms: { field: "traceId", size: 20 } },
      byDay: {
        date_histogram: {
          field: "requestedAt",
          calendar_interval: "day",
        },
      },
    },
  });

  return {
    serviceType: result?.aggregations?.byServiceType?.buckets || [],
    status: result?.aggregations?.byStatus?.buckets || [],
    errorCode: result?.aggregations?.byErrorCode?.buckets || [],
    traceId: result?.aggregations?.byTraceId?.buckets || [],
    daily: result?.aggregations?.byDay?.buckets || [],
  };
}

module.exports = {
  normalizeHistoryDocument,
  buildDocumentId,
  upsertHistoryLog,
  buildSearchQuery,
  searchHistoryIndex,
  aggregateHistoryIndex,
};
