const { redisClient } = require("../infra/redisDb");
const { eq } = require("drizzle-orm");
const { v4: uuidv4 } = require("uuid");
const { db } = require("../infra/postgresDb");
const { wallets } = require("../model/schema/wallets");
const { walletTransactions } = require("../model/schema/walletTransactions");
const { NotFoundError, InsufficientFundsError, ValidationError } = require("../Utility/error");

const getBalance = async (companyId) => {
  console.log("Getting wallet balance", { companyId });

  const [wallet] = await db
    .select()
    .from(wallets)
    .where(eq(wallets.companyId, companyId))
    .limit(1);

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

  if (cacheKey) {
    const cacheResult = await redisClient.get(cacheKey);
    if (cacheResult) return JSON.parse(cacheResult);
  }

  const result = await db.transaction(async (tx) => {
    if (requestId) {
      const [existing] = await tx
        .select()
        .from(walletTransactions)
        .where(eq(walletTransactions.requestId, requestId))
        .limit(1);

      if (existing) {
        console.log("Found existing transaction inside transaction block");
        return { success: true, transaction: existing };
      }
    }
    const [wallet] = await tx
      .select()
      .from(wallets)
      .where(eq(wallets.companyId, companyId))
      .for("no key update")
      .limit(1);

    if (!wallet) {
      console.log("wallet not found");
      throw new NotFoundError("wallet", { companyId });
    }

    const balanceBefore = wallet.balance;
    const balanceAfter = balanceBefore + amountInKobo;

    const [transaction] = await tx
      .insert(walletTransactions)
      .values({
        id: uuidv4(),
        walletId: wallet.id,
        requestId,
        type: "CREDIT",
        amount: amountInKobo,
        balanceBefore,
        balanceAfter,
        reference: requestId, // identifier has to be from there side
      })
      .returning();

    await tx
      .update(wallets)
      .set({
        balance: balanceAfter,
        updatedAt: new Date(),
      })
      .where(eq(wallets.id, wallet.id));

    return { success: true, transaction };
  });

  if (cacheKey) {
    await redisClient.set(cacheKey, JSON.stringify(result), { EX: 8400 });
  }

  console.log("Wallet funded successfully");
  return result;
};

const debitWallet = async ({
  amountInKobo,
  requestId,
  companyId,
  description = "NIN verification request",
}) => {
  console.log("Debiting wallet", { companyId, amountInKobo, requestId });

  if (amountInKobo < 0) {
    throw new ValidationError("Amount cannot be negative", { amountInKobo });
  }
  const cacheKey = requestId ? `billing:debit:${requestId}` : null;

  if (cacheKey) {
    const cacheResult = await redisClient.get(cacheKey);
    if (cacheResult) return JSON.parse(cacheResult);
  }

  // Idempotent check in DB
  

  const result = await db.transaction(async (tx) => {
    if (requestId) {
      const [existing] = await tx
        .select()
        .from(walletTransactions)
        .where(eq(walletTransactions.requestId, requestId))
        .limit(1);

      if (existing) {
        console.log(
          "Idempotent debit request - returning existing transaction",
        );
        return { success: true, transaction: existing };
      }
    }
    const [wallet] = await tx
      .select()
      .from(wallets)
      .where(eq(wallets.companyId, companyId))
      .for("no key update")
      .limit(1);

    if (!wallet) {
      console.log("wallet does not exist");
      throw new NotFoundError("wallet", { companyId });
    }

    if (wallet.balance < amountInKobo) {
      console.log("Insufficient funds for debit");
      throw new InsufficientFundsError("Insufficient funds", {
        required: amountInKobo,
        available: wallet.balance,
        companyId,
      });
    }
    const [transaction] = await tx
  .insert(walletTransactions)
  .values({
    id: uuidv4(),
    walletId: wallet.id,
    requestId,
    type: "DEBIT",
    amount: amountInKobo,
    balanceBefore: wallet.balance,
    balanceAfter: sql`${wallet.balance} - ${amountInKobo}`,
    description,
    reference: uuidv4(),
  })
  .returning();

await tx
  .update(wallets)
  .set({
    balance: sql`${wallets.balance} - ${amountInKobo}`,
    updatedAt: new Date(),
  })
  .where(eq(wallets.id, wallet.id));

    
    console.log("Wallet debited successfully");
    return { success: true, transaction };
  });

  if (cacheKey) {
    await redisClient.set(cacheKey, JSON.stringify(result), { EX: 8400 });
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
    .orderBy(walletTransactions.createdAt).limit(limit).offset(offset);


  return {
    transactions,
    pagination: {
      limit,
      offset,
      total:count,
    },
  };
};


module.exports = {
  getBalance,
  fundWallet,
  debitWallet,
  getWalletHistory,
};
