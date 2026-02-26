const express = require("express");
const webhookController = require("../controller/webhookController");

const router = express.Router();
const verificationController = require("../controller/verificationController");
const apiKeyAuth = require("../middlewares/apiKeyMiddleware");
const validate = require("../middlewares/validatorMiddlewar");
const { rateLimitMiddleware } = require("../middlewares/rateLimitMiddleware");
const {
  verifyNINSchema,
  verifyBVNSchema,
  verifyLicenseSchema,
  verifyPassportSchema,
  paramsVerificationSchema,
} = require("../validators/validator");

router.post(
  "/nin",

  validate(verifyNINSchema),
  apiKeyAuth,
  // rateLimitMiddleware(),
  verificationController.verifyNIN,
);

router.post(
  "/bvn",
  apiKeyAuth,
  validate(verifyBVNSchema),
  rateLimitMiddleware(),
  verificationController.verifyBVN,
);

router.post(
  "/drivers-license",
  apiKeyAuth,
  validate(verifyLicenseSchema),
  rateLimitMiddleware(),
  verificationController.verifyLicense,
);

router.post(
  "/passport",
  apiKeyAuth,
  validate(verifyPassportSchema),
  rateLimitMiddleware(),
  verificationController.verifyPassport,
);

router.get(
  "/verification/:id",
  apiKeyAuth,
  validate(paramsVerificationSchema, "params"),
  verificationController.getVerificationStatus,
);

router.post("/gov-provider", webhookController.handleGovProviderWebhook);
module.exports = router;
