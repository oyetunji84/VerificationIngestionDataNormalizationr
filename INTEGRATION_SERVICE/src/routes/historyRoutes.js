const express = require('express');
const router = express.Router();
const historyController = require('../controller/historyController');
const apiKeyAuth = require('../middlewares/apiKeyMiddleware');
const validate = require('../middlewares/validatorMiddlewar');
const { historyFiltersSchema } = require('../validators/validator');

/**
 * @route   GET /api/history
 * @desc    Get verification history with filters
 * @access  Private (requires API key)
 * @query   serviceType, startDate, endDate, status, page, limit
 */
router.get('/', apiKeyAuth, validate(historyFiltersSchema, 'query'), historyController.getHistory);

// /**
//  * @route   GET /api/history/stats
//  * @desc    Get verification statistics
//  * @access  Private (requires API key)
//  * @query   serviceType, startDate, endDate
//  */
// router.get('/stats', apiKeyAuth, historyController.getStats);   

module.exports = router;