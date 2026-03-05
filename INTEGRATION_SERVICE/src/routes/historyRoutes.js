const express = require("express");
const router = express.Router();
const historyController = require("../controller/historyController");
const apiKeyAuth = require("../middlewares/apiKeyMiddleware");
const { internalApiKeyAuth } = require("../middlewares/internalApiKeyMiddleware");
const validate = require("../middlewares/validatorMiddlewar");
const {
  historyFiltersSchema,
  historySearchSchema,
  historyAggregationSchema,
  historyReindexSchema,
} = require("../validators/validator");

router.get(
  "/",
  apiKeyAuth,
  validate(historyFiltersSchema, "query"),
  historyController.getHistory,
);

router.get(
  "/internal/search",
  internalApiKeyAuth,
  validate(historySearchSchema, "query"),
  historyController.searchHistoryController,
);

router.get(
  "/internal/aggregations",
  internalApiKeyAuth,
  validate(historyAggregationSchema, "query"),
  historyController.aggregateHistoryController,
);

router.post(
  "/internal/reindex",
  internalApiKeyAuth,
  validate(historyReindexSchema),
  historyController.enqueueReindexController,
);

router.get(
  "/internal/reindex/:jobId",
  internalApiKeyAuth,
  historyController.getReindexStatusController,
);

module.exports = router;
