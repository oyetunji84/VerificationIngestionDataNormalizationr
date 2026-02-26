const express = require("express");
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
router.post(
  "/verification/:id",
  apiKeyAuth,
  validate(),
  verificationController.getVerificationStatus,
);

router.get("/");
module.exports = router;
