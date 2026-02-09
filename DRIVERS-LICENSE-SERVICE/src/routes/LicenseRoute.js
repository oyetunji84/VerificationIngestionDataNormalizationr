const express = require('express');
const router = express.Router();

const {verifyLicense} = require('../controllers/LicenseController');
const verifyLicenseSchema = require('../validator/LIcenseValidator');
const validate = require('../middleware/verifyMiddlewareLicense')
// POST /verify - Verify License
router.post('/verify/DriversLicense', validate(verifyLicenseSchema), verifyLicense);

module.exports = router;
