const express = require("express");
const router = express.Router();
const { verifyBVN } = require("../controller/BvnController");

router.post("/verify/BVN", verifyBVN);

module.exports = router;