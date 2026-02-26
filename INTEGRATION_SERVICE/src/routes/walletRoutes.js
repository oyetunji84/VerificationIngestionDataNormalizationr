const express = require("express");
const router = express.Router();
const { rateLimitMiddleware } = require("../middlewares/rateLimitMiddleware");
const apiKeyAuth = require("../middlewares/apiKeyMiddleware");
const validate = require("../middlewares/validatorMiddlewar");
const {
  fundWalletSchema,
  walletHistoryQuerySchema,
} = require("../validators/validator");
const {
  fundWallet,
  getWalletBalance,
  getWalletHistory,
  createWallet,
} = require("../controller/walletController");

router.post("/create", apiKeyAuth, createWallet);
router.post(
  "/fund",
  validate(fundWalletSchema),
  apiKeyAuth,
  //   rateLimitMiddleware(), // Apply rate limiting middleware to this route
  fundWallet,
);

router.get("/wallet/balance", apiKeyAuth, getWalletBalance);

router.get(
  "/wallet/transactions",
  validate(walletHistoryQuerySchema, "query"),
  apiKeyAuth,
  getWalletHistory,
);

module.exports = router;
