const express = require("express");
const { apiKeyAuth } = require("../middleware/apiKeyMiddleware");
const router = express.Router();
const validate = require("../middleware/ValidateMiddleware");
const {
  createCompanySchema,
  fundWalletSchema,
  verifyBVNSchema,
  verifyNINSchema,
} = require("../Validator/validator");
const { createCompanyController } = require("../controller/companyController");
const {
  createWalletController,
  fundWalletController,
  getWalletBalanceController,
} = require("../controller/walletController");
const { verifyBvnController } = require("../controller/BvnController");
const { verifyNinController } = require("../controller/ninController");
const {
  verifyLicenseSchema,
  verifyPassportSchema,
} = require("../Validator/validator");
const { verifyLicenseController } = require("../controller/LicenseController");
const {
  verifyPassportController,
} = require("../controller/PassportController");

router.post("/getKey", validate(createCompanySchema), createCompanyController);
router.post("/wallet", apiKeyAuth, createWalletController);
router.post(
  "/wallet/fund",
  apiKeyAuth,
  validate(fundWalletSchema),
  fundWalletController,
);
router.get("/wallet/balance", apiKeyAuth, getWalletBalanceController);
router.post(
  "/verify/NIN",
  apiKeyAuth,
  validate(verifyNINSchema),
  verifyNinController,
);

router.post("/register/WebHook", (req, res) => {
  res.send("Webhook registration endpoint");
});
router.post(
  "/verify/BVN",
  apiKeyAuth,
  validate(verifyBVNSchema),
  verifyBvnController,
);

router.post(
  "/verify/Passport",
  apiKeyAuth,
  validate(verifyPassportSchema),
  verifyPassportController,
);

router.post(
  "/verify/License",
  apiKeyAuth,
  validate(verifyLicenseSchema),
  verifyLicenseController,
);

module.exports = router;
