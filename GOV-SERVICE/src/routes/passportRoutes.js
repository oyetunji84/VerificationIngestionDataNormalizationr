const express = require("express");
const router = express.Router();
const passportController = require("../controller/passportController");
const validate = require("../middleware/verifyMiddleware");
const verifySchema = require("../validator/passportValidator");
// POST /verify - Verify Passport
router.post(
  "/verify/passport",
  validate(verifySchema),
  passportController.verifyPassport,
);

module.exports = router;
