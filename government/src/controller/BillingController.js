const crypto = require("crypto");
const billingService = require("../service/billingService/billingService");
const asyncHandler = require("../utils/asyncHandler");

exports.fundWallet = asyncHandler(async (req, res) => {
  const { amount, reference } = req.body;
  const idempotencyKey =
    req.headers["x-idempotency-key"] || crypto.randomUUID();
  const organizationId = req.organization._id.toString(); // From auth middleware
  console.log(amount, reference, idempotencyKey);
  const result = await billingService.fundWallet(
    organizationId,
    amount,
    reference,
    idempotencyKey,
  );
  res.json({ status: "success", data: result });
});

exports.getBalance = asyncHandler(async (req, res) => {
  const organizationId = req.organization._id.toString();
  const balance = await billingService.getBalance(organizationId);
  res.json({ status: "success", data: { balance } });
});

exports.getHistory = asyncHandler(async (req, res) => {
  const organizationId = req.organization._id.toString();
  const { page, limit } = req.query;
  const history = await billingService.getHistory(organizationId, page, limit);
  res.json({ status: "success", data: history });
});

exports.createWallet = asyncHandler(async (req, res) => {
  const organizationId = req.organization._id.toString();
  const result = await billingService.findOrCreateWallet(organizationId);
  res.json({ status: "success", data: result });
});
