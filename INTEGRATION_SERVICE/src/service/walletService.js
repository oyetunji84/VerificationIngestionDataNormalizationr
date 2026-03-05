const { redisClient } = require("../infra/redisDb");
const { v4: uuidv4 } = require("uuid");
const walletRepository = require("../repository/walletRepository");
const {
  NotFoundError,
  InsufficientFundsError,
  ValidationError,
} = require("../../utility/error");

const getBalance = async (companyId) => {
  console.log("Getting wallet balance", { companyId });

  const wallet = await walletRepository.findWalletByCompanyId(companyId);
  if (!wallet) {
    throw new NotFoundError("wallet", { companyId });
  }

  return {
    balance: wallet.balance,
    balanceInNaira: wallet.balance / 100,
    currency: wallet.currency,
    walletId: wallet.id,
    companyId: wallet.companyId,
  };
};

const createWallet = async (companyId) => {
  console.log("Creating wallet for company", { companyId });

  const existing = await walletRepository.findWalletByCompanyId(companyId);
  if (existing) {
    console.log("Wallet already exists for company", { companyId });
    return existing;
  }

  const wallet = await walletRepository.createWallet({
    id: uuidv4(),
    companyId,
    balance: 0,
    currency: "NGN",
  });

  console.log("Wallet created for company", { companyId, wallet });
  return wallet;
};

const fundWallet = async ({ amountInKobo, companyId, requestId, description }) => {
  console.log("FUNDING WALLET", { companyId, amountInKobo, requestId });

  if (amountInKobo < 0) {
    throw new ValidationError("Amount cannot be negative", { amountInKobo });
  }

  const cacheKey = requestId ? `billing:fund:${requestId}` : null;
  if (cacheKey) {
    const cacheResult = await redisClient.get(cacheKey);
    if (cacheResult) return JSON.parse(cacheResult);
  }

  const result = await walletRepository.createCreditTransactionAndUpdateBalance({
    companyId,
    amountInKobo,
    requestId,
    description,
  });

  if (!result.wallet && !result.alreadyProcessed) {
    throw new NotFoundError("wallet", { companyId });
  }

  const payload = { success: true, transaction: result.transaction };

  if (cacheKey) {
    await redisClient.set(cacheKey, JSON.stringify(payload), { EX: 8400 });
  }

  return payload;
};

const debitWallet = async ({
  amountInKobo,
  idempotencyKey,
  requestId,
  companyId,
  description = "NIN verification request",
}) => {
  const effectiveRequestId = idempotencyKey || requestId;

  console.log("Debiting wallet", {
    companyId,
    amountInKobo,
    requestId: effectiveRequestId,
  });

  if (amountInKobo < 0) {
    throw new ValidationError("Amount cannot be negative", { amountInKobo });
  }

  const cacheKey = effectiveRequestId
    ? `billing:debit:${effectiveRequestId}`
    : null;
  if (cacheKey) {
    const cacheResult = await redisClient.get(cacheKey);
    if (cacheResult) return JSON.parse(cacheResult);
  }

  const result = await walletRepository.createDebitTransactionAndUpdateBalance({
    companyId,
    amountInKobo,
    requestId: effectiveRequestId,
    description,
  });

  if (!result.wallet && !result.alreadyProcessed) {
    throw new NotFoundError("wallet", { companyId });
  }

  if (result.insufficientFunds) {
    throw new InsufficientFundsError("Insufficient funds", {
      required: amountInKobo,
      available: result.wallet.balance / 100,
      companyId,
    });
  }

  const payload = { success: true, transaction: result.transaction };

  if (cacheKey) {
    await redisClient.set(cacheKey, JSON.stringify(payload), { EX: 8400 });
  }

  return payload;
};

const getWalletHistory = async ({ companyId, limit, offset }) => {
  const wallet = await walletRepository.findWalletByCompanyId(companyId);

  if (!wallet) {
    return {
      transactions: [],
      pagination: { limit, offset, total: 0 },
    };
  }

  const [transactions, count] = await Promise.all([
    walletRepository.listTransactionsByWalletId(wallet.id, { limit, offset }),
    walletRepository.countTransactionsByWalletId(wallet.id),
  ]);

  return {
    transactions,
    pagination: {
      limit,
      offset,
      total: count,
    },
  };
};

module.exports = {
  createWallet,
  getBalance,
  fundWallet,
  debitWallet,
  getWalletHistory,
};
