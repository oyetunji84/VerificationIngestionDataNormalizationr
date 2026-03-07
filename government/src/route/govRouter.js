const express = require("express");
const router = express.Router();

const ninController = require("../../src/controller/ninController");
const bvnController = require("../../src/controller/bvnController");
const passportController = require("../../src/controller/passportController");
const dlController = require("../../src/controller/licenseController");

const authorize = require("../middleware/authMiddleware");
const validatePrivacy = require("../middleware/validateMiddleware");
// const rateLimit = require("../../middlewares/rateLimit.middleware");
// rateLimit("nin", 100);
router.use(authorize);
router.use(validatePrivacy);

router.post("/verify/nin", ninController.verifyNIN);
router.post("/verify/bvn", bvnController.verifyBVN);
router.post("/verify/passport", passportController.verifyPassport);
router.post("/verify/license", dlController.verifyDL);

module.exports = router;
