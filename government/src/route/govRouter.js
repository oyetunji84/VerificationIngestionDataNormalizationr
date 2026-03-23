const express = require("express");
const router = express.Router();

const ninController = require("../../src/controller/ninController");
const bvnController = require("../../src/controller/bvnController");
const passportController = require("../../src/controller/passportController");
const dlController = require("../../src/controller/licenseController");

const authorize = require("../middleware/authMiddleware");
const validatePrivacy = require("../middleware/validateMiddleware");
const rateLimit = require("../middleware/rateLimiter");
router.use(authorize);
router.use(rateLimit);
router.post("/verify/nin", validatePrivacy, ninController.verifyNIN);
router.post("/verify/bvn", validatePrivacy, bvnController.verifyBVN);
router.post(
  "/verify/passport",
  validatePrivacy,
  passportController.verifyPassport,
);
router.post("/verify/license", validatePrivacy, dlController.verifyDL);

module.exports = router;
