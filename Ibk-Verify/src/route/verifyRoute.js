const express = require("express");
const router = express.Router();
const verificationController = require("../controller/verifyController");
const validate = require("../middleware/validateMiddleware");
// const rateLimit = require("../../middlewares/rateLimit.middleware");
const middlware = require("../middleware/authorizeMiddleware");
const { verifySchema } = require("../validator/verifySchema");

router.post(
  "/verify",
  validate(verifySchema),
  middlware,
  verificationController.queueVerification,
);

router.get("/verification/:id", verificationController.getVerificationStatus);

module.exports = router;
