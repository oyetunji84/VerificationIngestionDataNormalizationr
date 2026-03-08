const express = require("express");
const router = express.Router();
const webhookController = require("../controller/webhookController");

router.post("/gov-provider", webhookController.handleGovProviderWebhook);

module.exports = router;
