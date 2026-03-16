const express = require("express");
const router = express.Router();
const billingController = require("../controller/billingController");
const validate = require("../middleware/validateMiddleware");
const authorize = require("../middleware/authorizeMiddleware");
const { fundSchema } = require("../validator/billingSchema");

router.use(authorize);

router.post("/wallet", billingController.createWallet);
router.get("/balance", billingController.getBalance);
router.post("/fund", validate(fundSchema), billingController.fundWallet);

module.exports = router;
