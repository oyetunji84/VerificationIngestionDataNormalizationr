const express = require("express");
const router = express.Router();
const { verifyBVN } = require("../controller/BvnController");
const BvnValidator = require("../validator/BvnValidator");
const verifyMiddleware = require("../middleware/verifyMiddleware");

router.post("/verify/BVN", verifyMiddleware(BvnValidator), verifyBVN);

module.exports = router;
