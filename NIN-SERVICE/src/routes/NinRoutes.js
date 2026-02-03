const express = require("express");
const router = express.Router();
const { verifyNIN } = require("../controller/NinController");

router.post("/verify", verifyNIN);

module.exports = router;