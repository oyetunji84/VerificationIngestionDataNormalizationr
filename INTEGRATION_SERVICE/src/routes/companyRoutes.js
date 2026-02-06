const express = require('express');
const router = express.Router();
const companyController = require('../controller/companyController');
const validate = require('../middlewares/validatorMiddlewar');
const { registerCompanySchema } = require('../validators/validator');

/**
 * @route   POST /api/company/register
 * @desc    Register a new company and get API key
 * @access  Public
 */
router.post('/register', validate(registerCompanySchema), companyController.register);

module.exports = router;