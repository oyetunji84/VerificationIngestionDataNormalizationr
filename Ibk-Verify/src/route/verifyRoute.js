const express = require("express");
const router = express.Router();
const verificationController = require("../controller/verifyController");
const validate = require("../middleware/validateMiddleware");
const middlware = require("../middleware/authorizeMiddleware");
const { verifySchema } = require("../validator/verifySchema");

const authorize = require("../middleware/authorizeMiddleware");
const rateLimit = require("../middleware/rateLimitMiddleware");
router.use(authorize);
router.use(rateLimit);
router.post(
  "/verify",
  validate(verifySchema),
  middlware,
  verificationController.queueVerification,
);

router.get("/verification/:id", verificationController.getVerificationStatus);

module.exports = router;
