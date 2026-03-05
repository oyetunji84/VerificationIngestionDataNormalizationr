const History = require("../models/historyModel");

function buildHistoryQuery(filters = {}) {
  const { apiKey, serviceType, startDate, endDate, status, requestId } = filters;

  const query = {};

  if (apiKey) query.apiKey = apiKey;
  if (serviceType) query.serviceType = serviceType;
  if (status) query.status = status;
  if (requestId) query.requestId = requestId;

  if (startDate || endDate) {
    query.requestedAt = {};
    if (startDate) query.requestedAt.$gte = new Date(startDate);
    if (endDate) query.requestedAt.$lte = new Date(endDate);
  }

  return query;
}

async function createLog(logData) {
  const historyEntry = new History({
    ...logData,
    requestedAt: logData.requestedAt || new Date(),
  });

  return historyEntry.save();
}

async function findByFilters(filters, pagination = {}) {
  const { page = 1, limit = 20 } = pagination;
  const query = buildHistoryQuery(filters);
  const skip = (page - 1) * limit;

  const [results, total] = await Promise.all([
    History.find(query)
      .sort({ requestedAt: -1 })
      .skip(skip)
      .limit(limit)
      .select("-__v")
      .lean(),
    History.countDocuments(query),
  ]);

  return { results, total, page, limit };
}

async function countByFilters(filters = {}) {
  return History.countDocuments(buildHistoryQuery(filters));
}

async function findByFiltersPaged(filters = {}, skip = 0, limit = 200) {
  return History.find(buildHistoryQuery(filters))
    .sort({ requestedAt: 1, _id: 1 })
    .skip(skip)
    .limit(limit)
    .select("-__v")
    .lean();
}

async function aggregateStats(filters = {}) {
  const { apiKey, serviceType, startDate, endDate } = filters;

  const matchQuery = {};
  if (apiKey) matchQuery.apiKey = apiKey;
  if (serviceType) matchQuery.serviceType = serviceType;

  if (startDate || endDate) {
    matchQuery.requestedAt = {};
    if (startDate) matchQuery.requestedAt.$gte = new Date(startDate);
    if (endDate) matchQuery.requestedAt.$lte = new Date(endDate);
  }

  return History.aggregate([
    { $match: matchQuery },
    {
      $group: {
        _id: null,
        totalVerifications: { $sum: 1 },
        byService: {
          $push: {
            serviceType: "$serviceType",
            status: "$status",
          },
        },
        byStatus: {
          $push: "$status",
        },
      },
    },
    {
      $project: {
        _id: 0,
        totalVerifications: 1,
        byService: 1,
        byStatus: 1,
      },
    },
  ]);
}

module.exports = {
  createLog,
  findByFilters,
  countByFilters,
  findByFiltersPaged,
  aggregateStats,
};
