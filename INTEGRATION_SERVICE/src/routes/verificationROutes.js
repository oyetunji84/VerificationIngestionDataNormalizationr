const express = require('express');
const router = express.Router();
const verificationController = require('../controller/verificationController');
const apiKeyAuth = require('../middlewares/apiKeyMiddleware');
const validate = require('../middlewares/validatorMiddlewar');
const {
  verifyNINSchema,
  verifyBVNSchema,
  verifyLicenseSchema,
  verifyPassportSchema
} = require('../validators/validator');

/**
 * @route   POST /api/verify/nin
 * @desc    Verify NIN (National Identity Number)
 * @access  Private (requires API key)
 */
router.post('/nin', apiKeyAuth, validate(verifyNINSchema), verificationController.verifyNIN);

/**
 * @route   POST /api/verify/bvn
 * @desc    Verify BVN (Bank Verification Number)
 * @access  Private (requires API key)
 */
router.post('/bvn', apiKeyAuth, validate(verifyBVNSchema), verificationController.verifyBVN);

/**
 * @route   POST /api/verify/drivers-license
 * @desc    Verify Drivers License
 * @access  Private (requires API key)
 */
router.post('/drivers-license', apiKeyAuth, validate(verifyLicenseSchema), verificationController.verifyLicense);

/**
 * @route   POST /api/verify/passport
 * @desc    Verify International Passport
 * @access  Private (requires API key)
 */
router.post('/passport', apiKeyAuth, validate(verifyPassportSchema), verificationController.verifyPassport);

module.exports = router;