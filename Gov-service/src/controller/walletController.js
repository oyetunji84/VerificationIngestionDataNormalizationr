const { asyncHandler, ValidationError } = require("../utility/error");
const { fundWallet, getBalance } = require("../services/WalletService");
const { createWalletMissing } = require("../repository/companyRepository");
const { v4: uuidv4 } = require("uuid");
const createWalletController = asyncHandler(async (req, res) => {
  const companyId = req.company?.id;
  if (!companyId) {
    throw new ValidationError("Company context missing", {
      reason: "apiKeyAuth did not set req.company.id",
    });
  }

  const wallet = await createWalletIfMissing(companyId);

  return res.status(201).json({
    success: true,
    data: {
      wallet,
    },
  });
});

const fundWalletController = asyncHandler(async (req, res) => {
  const companyId = req.company?.id;
  if (!companyId) {
    throw new ValidationError("Company context missing", {
      reason: "apiKeyAuth did not set req.company.id",
    });
  }

  const requestId =
    req.header("x-idempotency-key") ||
    req.header("X-IDEMPOTENCY-KEY") ||
    uuidv4();
  const { amountInNaira } = req.validatedData;

  const amountInKobo = Math.round(Number(amountInNaira) * 100);
  if (!Number.isFinite(amountInKobo) || amountInKobo <= 0) {
    throw new ValidationError("Invalid amountInNaira", { amountInNaira });
  }

  await createWalletMissing(companyId);

  const result = await fundWallet({
    amountInKobo,
    companyId,
    requestId,
  });

  return res.status(200).json({
    success: true,
    data: {
      amountInNaira,
      amountInKobo,
      result,
    },
  });
});

const getWalletBalanceController = asyncHandler(async (req, res) => {
  const companyId = req.company?.id;
  if (!companyId) {
    throw new ValidationError("Company context missing", {
      reason: "apiKeyAuth did not set req.company.id",
    });
  }

  const balance = await getBalance(companyId);

  return res.status(200).json({
    success: true,
    data: balance,
  });
});

module.exports = {
  createWalletController,
  fundWalletController,
  getWalletBalanceController,
};

