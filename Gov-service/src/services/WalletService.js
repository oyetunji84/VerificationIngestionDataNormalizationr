const { redisClient } = require("../infra/redisDb");
const { eq, sql } = require("drizzle-orm");

const { db } = require("../infra/PostgressDb");
const { wallets } = require("../model/schema/wallets");
const {
  getWalletByCompanyId,
  DebitWalletTransaction,
  FundWalletTransaction,
} = require("../repository/companyRepository");
const { walletTransactions } = require("../model/schema/walletTransactions");
const {
  NotFoundError,
  InsufficientFundsError,
  ValidationError,
} = require("../utility/error");

const getBalance = async (companyId) => {
  console.log("Getting wallet balance", { companyId });

  const wallet = await getWalletByCompanyId(companyId);
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

const fundWallet = async ({ amountInKobo, companyId, requestId }) => {
  console.log("FUNDING WALLET", { companyId, amountInKobo, requestId });
  if (amountInKobo < 0) {
    throw new ValidationError("Amount cannot be negative", { amountInKobo });
  }
  const cacheKey = requestId ? `billing:fund:${requestId}` : null;

  let cacheResult = null;
  if (cacheKey) {
    try {
      const raw = await redisClient.get(cacheKey);
      cacheResult = raw ? JSON.parse(raw) : null;
    } catch (err) {
      console.error(
        "[GOV-SERVICE] Redis GET failed, continuing without cache",
        {
          cacheKey,
          err,
        },
      );
    }
  }
  if (cacheResult) return cacheResult;

  const result = await FundWalletTransaction(
    requestId,
    companyId,
    amountInKobo,
  );

  if (cacheKey) {
    try {
      await redisClient.set(cacheKey, JSON.stringify(result), { EX: 8400 });
    } catch (err) {
      console.error(
        "[GOV-SERVICE] Redis SET failed, continuing without cache",
        {
          cacheKey,
          err,
        },
      );
    }
  }

  console.log("Wallet funded successfully");
  return result;
};

const debitWallet = async ({
  requestId,
  companyId,
  amountInKobo,
  description,
}) => {
  console.log("Debiting wallet", { companyId, amountInKobo, requestId });

  if (amountInKobo < 0) {
    throw new ValidationError("Amount cannot be negative", { amountInKobo });
  }
  const cacheKey = requestId ? `billing:debit:${requestId}` : null;
  let cacheResult = null;
  if (cacheKey) {
    try {
      const raw = await redisClient.get(cacheKey);
      cacheResult = JSON.parse(raw);
    } catch (err) {
      console.error(
        "[GOV-SERVICE] Redis GET failed, continuing without cache",
        {
          cacheKey,
          err,
        },
      );
    }
  }
  if (cacheResult) return cacheResult;
  const result = await DebitWalletTransaction(
    requestId,
    companyId,
    amountInKobo,
    description,
  );
  if (cacheKey) {
    try {
      await redisClient.set(cacheKey, JSON.stringify(result), { EX: 8400 });
    } catch (err) {
      console.error(
        "[GOV-SERVICE] Redis SET failed, continuing without cache",
        {
          cacheKey,
          err,
        },
      );
    }
  }

  return result;
};

const getWalletHistory = async ({ companyId, limit, offset }) => {
  const [wallet] = await db
    .select()
    .from(wallets)
    .where(eq(wallets.companyId, companyId))
    .limit(1);

  if (!wallet) {
    return {
      transactions: [],
      pagination: { limit, offset, total: 0 },
    };
  }

  const [{ count }] = await db
    .select({ count: sql`count(*)::int` })
    .from(walletTransactions)
    .where(eq(walletTransactions.walletId, wallet.id));

  const transactions = await db
    .select()
    .from(walletTransactions)
    .where(eq(walletTransactions.walletId, wallet.id))
    .orderBy(walletTransactions.createdAt)
    .limit(limit)
    .offset(offset);

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
  getBalance,
  fundWallet,
  debitWallet,
  getWalletHistory,
};
