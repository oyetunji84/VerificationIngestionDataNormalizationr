const billingService = require("../service/Billing/billingGrpcService");
const asyncHandler = require("../utils/asyncHandler");
const generateKey = require("../utils/generateUUId");
exports.getBalance = asyncHandler(async (req, res) => {
  const organizationId = req.company._id.toString();
  const balance = await billingService.getBalance(organizationId);
  console.log(balance);
  res.status(200).json({
    status: "success",
    data: balance,
  });
});

exports.fundWallet = asyncHandler(async (req, res) => {
  const organizationId = req.company._id.toString();
  const { amount } = req.body;
  const idempotencyKey = req.headers["x-idempotency-key"] || generateKey();

  const result = await billingService.fundWallet(
    organizationId,
    amount,
    idempotencyKey,
  );

  res.status(200).json({
    status: "success",
    data: result,
  });
});

exports.createWallet = asyncHandler(async (req, res) => {
  const organizationId = req.company._id.toString();
  const wallet = await billingService.findOrCreateWallet(organizationId);

  res.status(200).json({
    status: "success",
    data: wallet,
  });
});
