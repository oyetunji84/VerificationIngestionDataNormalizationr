const express = require('express');
const router = express.Router();
const verificationController = require('../controller/verificationController');
const apiKeyAuth = require('../middlewares/apiKeyMiddleware');
const validate = require('../middlewares/validatorMiddlewar');
const {createMiddleware}=require("../middlewares/rateLimitMiddleware")
const {
  verifyNINSchema,
  verifyBVNSchema,
  verifyLicenseSchema,
  verifyPassportSchema
} = require('../validators/validator');


router.post('/nin', apiKeyAuth, validate(verifyNINSchema), createMiddleware(), verificationController.verifyNIN);


router.post('/bvn', apiKeyAuth, validate(verifyBVNSchema), createMiddleware(), verificationController.verifyBVN);


router.post('/drivers-license', apiKeyAuth, validate(verifyLicenseSchema), createMiddleware(), verificationController.verifyLicense);


router.post('/passport', apiKeyAuth, validate(verifyPassportSchema), createMiddleware(), verificationController.verifyPassport);

module.exports = router;