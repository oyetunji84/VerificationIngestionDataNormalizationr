const express = require("express");
const router = express.Router();

const { verifyLicense } = require("../controller/LicenseController");
const verifyLicenseSchema = require("../validator/LicenseValidator");
const validate = require("../middleware/verifyMiddleware");
// POST /verify - Verify License
router.post(
  "/verify/DriversLicense",
  validate(verifyLicenseSchema),
  verifyLicense,
);

module.exports = router;
