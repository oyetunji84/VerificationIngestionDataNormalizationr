const express = require("express");
const router = express.Router();

const billingController = require("../controller/BillingController");
const authorize = require("../middleware/authMiddleware");
const { validateSchema } = require("../middleware/validateSchema");
const { fundSchema, historySchema } = require("../validator/billingSchema");

router.use(authorize);
console.log("here 1");
router.post("/wallet", billingController.createWallet);
router.post(
  "/fund",
  validateSchema(fundSchema, "body"),
  billingController.fundWallet,
);
router.get("/balance", billingController.getBalance);
router.get(
  "/history",
  validateSchema(historySchema, "query"),
  billingController.getHistory,
);

module.exports = router;
