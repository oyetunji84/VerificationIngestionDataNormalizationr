const { eq, sql } = require("drizzle-orm");
const { db } = require("../infra/postgresDb");
const { wallets } = require("../models/schema/wallets");
const { walletTransactions } = require("../models/schema/walletTransactions");
const { v4: uuidv4 } = require("uuid");

async function findWalletByCompanyId(companyId, tx = db) {
  const [wallet] = await tx
    .select()
    .from(wallets)
    .where(eq(wallets.companyId, companyId))
    .limit(1);

  return wallet || null;
}

async function createWallet({ id, companyId, balance = 0, currency = "NGN" }, tx = db) {
  const [wallet] = await tx
    .insert(wallets)
    .values({
      id,
      companyId,
      balance,
      currency,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .returning();

  return wallet;
}

async function findTransactionByRequestId(requestId, tx = db) {
  if (!requestId) return null;

  const [transaction] = await tx
    .select()
    .from(walletTransactions)
    .where(eq(walletTransactions.requestId, requestId))
    .limit(1);

  return transaction || null;
}

async function createCreditTransactionAndUpdateBalance({
  companyId,
  amountInKobo,
  requestId,
  description,
}) {
  return db.transaction(async (tx) => {
    const existing = await findTransactionByRequestId(requestId, tx);
    if (existing) {
      return { transaction: existing, alreadyProcessed: true };
    }

    const wallet = await findWalletByCompanyId(companyId, tx);
    if (!wallet) {
      return { wallet: null, transaction: null, alreadyProcessed: false };
    }

    const [transaction] = await tx
      .insert(walletTransactions)
      .values({
        id: uuidv4(),
        walletId: wallet.id,
        requestId,
        type: "CREDIT",
        amount: amountInKobo,
        balanceBefore: wallet.balance,
        balanceAfter: sql`${wallet.balance}::numeric + ${amountInKobo}::numeric`,
        description,
        reference: uuidv4(),
      })
      .returning();

    await tx
      .update(wallets)
      .set({
        balance: sql`${wallets.balance}::numeric + ${amountInKobo}::numeric`,
        updatedAt: new Date(),
      })
      .where(eq(wallets.id, wallet.id));

    return { wallet, transaction, alreadyProcessed: false };
  });
}

async function createDebitTransactionAndUpdateBalance({
  companyId,
  amountInKobo,
  requestId,
  description,
}) {
  return db.transaction(async (tx) => {
    const existing = await findTransactionByRequestId(requestId, tx);
    if (existing) {
      return {
        transaction: existing,
        wallet: null,
        alreadyProcessed: true,
        insufficientFunds: false,
      };
    }

    const [wallet] = await tx
      .select()
      .from(wallets)
      .where(eq(wallets.companyId, companyId))
      .for("no key update")
      .limit(1);

    if (!wallet) {
      return {
        wallet: null,
        transaction: null,
        alreadyProcessed: false,
        insufficientFunds: false,
      };
    }

    if (wallet.balance < amountInKobo) {
      return {
        wallet,
        transaction: null,
        alreadyProcessed: false,
        insufficientFunds: true,
      };
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
        balanceAfter: sql`${wallet.balance}::numeric - ${amountInKobo}::numeric`,
        description,
        reference: uuidv4(),
      })
      .returning();

    await tx
      .update(wallets)
      .set({
        balance: sql`${wallets.balance}::numeric - ${amountInKobo}::numeric`,
        updatedAt: new Date(),
      })
      .where(eq(wallets.id, wallet.id));

    return {
      wallet,
      transaction,
      alreadyProcessed: false,
      insufficientFunds: false,
    };
  });
}

async function listTransactionsByWalletId(walletId, { limit, offset }) {
  return db
    .select()
    .from(walletTransactions)
    .where(eq(walletTransactions.walletId, walletId))
    .orderBy(walletTransactions.createdAt)
    .limit(limit)
    .offset(offset);
}

async function countTransactionsByWalletId(walletId) {
  const [{ count }] = await db
    .select({ count: sql`count(*)::int` })
    .from(walletTransactions)
    .where(eq(walletTransactions.walletId, walletId));

  return count;
}

module.exports = {
  findWalletByCompanyId,
  createWallet,
  findTransactionByRequestId,
  createCreditTransactionAndUpdateBalance,
  createDebitTransactionAndUpdateBalance,
  listTransactionsByWalletId,
  countTransactionsByWalletId,
};
