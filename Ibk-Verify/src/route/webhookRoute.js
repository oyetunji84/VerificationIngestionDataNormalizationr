const express = require("express");
const router = express.Router();
const webhookController = require("../controller/webhookController");
const verifyWebHook = require("../middleware/verifyWebHookMiddleware");
router.post(
  "/webhook/gov-provider",
  express.raw({ type: "application/json" }),
  verifyWebHook,
  webhookController.handleGovProviderWebhook,
);

module.exports = router;
