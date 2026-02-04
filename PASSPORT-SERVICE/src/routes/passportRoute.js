const express = require('express');
const router = express.Router();
const passportController = require('../controllers/passportController')

// POST /verify - Verify Passport
router.post('/verify/passport', passportController.verifyPassport);

module.exports = router;