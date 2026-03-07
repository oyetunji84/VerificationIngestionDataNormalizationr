const express = require("express");
const router = express.Router();
const verificationController = require("../controller/verifyController");
const validate = require("../middleware/validateMiddleware");
// const rateLimit = require("../../middlewares/rateLimit.middleware");
const { verifySchema } = require("../validator/verifySchema");

router.post(
  "/verify",
  validate(verifySchema),
  verificationController.queueVerification,
);

router.get(
  "/verification/:id",

  verificationController.getVerificationStatus,
);

module.exports = router;
