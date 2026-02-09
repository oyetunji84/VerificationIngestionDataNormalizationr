const express = require("express");
const router = express.Router();
const { verifyNIN } = require("../controller/NinController");
const validate= require("../middleware/veriffyMIiddleware")
const ninValidator= require("../validator/ninValidator")
router.post("/verify/NIN",validate(ninValidator), verifyNIN);

module.exports = router;