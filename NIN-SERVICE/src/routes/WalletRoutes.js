const express = require("express");
const router = express.Router();
const {createMiddleware} = require("../middleware/rateLimitMiddleware");
const { apiKeyAuth } = require("../middleware/apiKeyAuth");
const validate = require("../middleware/veriffyMIiddleware");
const {
  fundWalletSchema,
  walletHistoryQuerySchema,
} = require("../validator/walletValidator");
const {
  fundWallet,
  getWalletBalance,
  getWalletHistory,
} = require("../controller/walletController");


router.post(
  "/wallet/fund",
  apiKeyAuth,
  validate(fundWalletSchema),
  createMiddleware(), // Apply rate limiting middleware to this route
  fundWallet,
);


router.get("/wallet/balance", apiKeyAuth, getWalletBalance);


router.get(
  "/wallet/transactions",
  apiKeyAuth,
  validate(walletHistoryQuerySchema, "query"),
  getWalletHistory,
);

module.exports = router;

