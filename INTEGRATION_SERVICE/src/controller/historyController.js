const {
  getHistoryByFilters,
  searchHistory,
  aggregateHistory,
  enqueueReindexJob,
  getReindexStatus,
} = require("../service/historyService");
const { buildTraceContextFromHeaders } = require("../infra/traceContext");

const getHistory = async (req, res, next) => {
  try {
    const { serviceType, startDate, endDate, status, requestId, traceId, page, limit } =
      req.validatedData;

    const filters = {
      apiKey: req.apiKey,
      serviceType,
      startDate,
      endDate,
      status,
      requestId,
      traceId,
    };

    Object.keys(filters).forEach((key) => {
      if (filters[key] === undefined) delete filters[key];
    });

    const result = await getHistoryByFilters(filters, { page, limit });

    return res.status(200).json({
      success: true,
      message: "History retrieved successfully",
      data: result.data,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
};

const searchHistoryController = async (req, res, next) => {
  try {
    const params = req.validatedData || req.query;
    const result = await searchHistory(params);

    return res.status(200).json({
      success: true,
      message: "History search completed",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const aggregateHistoryController = async (req, res, next) => {
  try {
    const params = req.validatedData || req.query;
    const result = await aggregateHistory(params);

    return res.status(200).json({
      success: true,
      message: "History aggregations completed",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const enqueueReindexController = async (req, res, next) => {
  try {
    const payload = req.validatedData || req.body;
    const traceContext = buildTraceContextFromHeaders(req.headers);

    const job = await enqueueReindexJob(payload, {
      traceId: traceContext.traceId,
      traceparent: traceContext.traceparent,
    });

    return res.status(202).json({
      success: true,
      message: "History reindex job queued",
      data: job,
    });
  } catch (error) {
    next(error);
  }
};

const getReindexStatusController = async (req, res, next) => {
  try {
    const { jobId } = req.params;
    const job = await getReindexStatus(jobId);

    if (!job) {
      return res.status(404).json({
        success: false,
        error: {
          code: "REINDEX_JOB_NOT_FOUND",
          message: `No reindex job found for ${jobId}`,
        },
      });
    }

    return res.status(200).json({
      success: true,
      message: "Reindex status fetched",
      data: job,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getHistory,
  searchHistoryController,
  aggregateHistoryController,
  enqueueReindexController,
  getReindexStatusController,
};
