const express = require("express");
const router = express.Router();
const webhookController = require("../controller/webhookController");

router.post(
  "/webhook/gov-provider",
  webhookController.handleGovProviderWebhook,
);

module.exports = router;
