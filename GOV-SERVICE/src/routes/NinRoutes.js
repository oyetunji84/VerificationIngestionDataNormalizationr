const express = require("express");
const router = express.Router();
const { verifyNIN } = require("../controller/NinController");
const validate = require("../middleware/verifyMiddleware");
const ninValidator = require("../validator/ninValidator");
const { apiKeyAuth } = require("../middleware/apiKeyAuth");

router.post("/verify/NIN", validate(ninValidator), apiKeyAuth, verifyNIN);

module.exports = router;
