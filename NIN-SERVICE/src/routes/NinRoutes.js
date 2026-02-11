const express = require("express");
const router = express.Router();
const { verifyNIN } = require("../controller/NinController");
const validate = require("../middleware/veriffyMIiddleware");
const ninValidator = require("../validator/ninValidator");
const { apiKeyAuth } = require("../middleware/apiKeyAuth");

router.post("/verify/NIN", apiKeyAuth, validate(ninValidator), verifyNIN);

module.exports = router;
