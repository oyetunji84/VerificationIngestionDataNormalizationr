const { asyncHandler } = require("../../utility/error");
const walletService = require("../service/walletService");
const { v4: uuidv4 } = require("uuid");
const createWallet = asyncHandler(async (req, res) => {
  const companyId = req.company?.id;
  const wallet = await walletService.createWallet(companyId);
  console.log("Wallet created successfully", { companyId, wallet });
  return res.status(201).json({
    success: true,
    wallet: {
      id: wallet.id,
      companyId: wallet.companyId,
      balance: wallet.balance,
      currency: wallet.currency,
      createdAt: wallet.createdAt,
    },
  });
});
const fundWallet = asyncHandler(async (req, res) => {
  const { amountInNaira, description } = req.body;

  const companyId = req.company?.id;
  const requestId =
    req.header("x-idempotency-key") ||
    req.header("X-IDEMPOTENCY-KEY") ||
    uuidv4();

  const amountInKobo = Math.round(amountInNaira * 100);

  const result = await walletService.fundWallet({
    amountInKobo,
    companyId,
    requestId,
    description,
  });

  const transaction = result.transaction;

  return res.status(200).json({
    success: true,
    requestId,
    transaction: {
      id: transaction.id,
      walletId: transaction.walletId,
      type: transaction.type,
      amount: transaction.amount,
      balanceBefore: transaction.balanceBefore,
      balanceAfter: transaction.balanceAfter,
      reference: transaction.reference,
      status: transaction.status || "COMPLETED",
      createdAt: transaction.createdAt,
    },
    balance: {
      amountInKobo: transaction.balanceAfter,
      amountInNaira: transaction.balanceAfter / 100,
    },
  });
});

const getWalletBalance = asyncHandler(async (req, res) => {
  const companyId = req.company?.id;
  const balance = await walletService.getBalance(companyId);

  return res.status(200).json({
    success: true,
    balance,
  });
});

const getWalletHistory = asyncHandler(async (req, res) => {
  const companyId = req.company?.id;
  const { limit, offset } = req.query;

  const result = await walletService.getWalletHistory({
    companyId,
    limit,
    offset,
  });

  return res.status(200).json({
    success: true,
    ...result,
  });
});

module.exports = {
  fundWallet,
  getWalletBalance,
  getWalletHistory,
  createWallet,
};
