const express = require('express');
const router = express.Router();

const {verifyLicense} = require('../controllers/LicenseController');

// POST /verify - Verify License
router.post('/verify/DriversLicense', verifyLicense);

module.exports = router;
