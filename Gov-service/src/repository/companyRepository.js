const { eq, sql, or } = require("drizzle-orm");
const { v4: uuidv4 } = require("uuid");
const { db } = require("../infra/PostgressDb");
const { companies } = require("../model/schema/companies");
const { InsufficientFundsError, NotFoundError } = require("../utility/error");
const { wallets } = require("../model/schema/wallets");
const { walletTransactions } = require("../model/schema/walletTransactions");
const checkApiKeyHash = async (apiKeyHash) => {
  try {
    const [company] = await db
      .select()
      .from(companies)
      .where(eq(companies.apiKeyHash, apiKeyHash))
      .limit(1);

    return company || null;
  } catch (error) {
    console.error("Error checking API key hash:", error);
    throw error;
  }
};
const FundWalletTransaction = async (
  requestId,
  companyId,
  amountInKobo,
  description,
) => {
  try {
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

      return { success: true, transaction };
    });
    return result;
  } catch (error) {
    console.error("Error creating wallet transaction:", error);
    throw error;
  }
};
const DebitWalletTransaction = async (
  requestId,
  companyId,
  amountInKobo,
  description,
) => {
  try {
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
      console.log("Wallet found for debit", { wallet });
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

      console.log("Wallet debited successfully");
      return { success: true, transaction };
    });
    return result;
  } catch (error) {
    console.error("Error creating wallet transaction:", error);
    throw error;
  }
};

const getWalletByCompanyId = async (companyId) => {
  try {
    const [wallet] = await db
      .select()
      .from(wallets)
      .where(eq(wallets.companyId, companyId))
      .limit(1);

    return wallet || null;
  } catch (error) {
    console.error("Error fetching wallet by company ID:", error);
    throw error;
  }
};

const createWalletMissing = async (companyId) => {
  try {
    const [existing] = await db
      .select()
      .from(wallets)
      .where(eq(wallets.companyId, companyId))
      .limit(1);

    if (existing) return existing;

    const [wallet] = await db
      .insert(wallets)
      .values({
        id: uuidv4(),
        companyId,
        balance: 0,
        currency: "NGN",
        status: "ACTIVE",
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    return wallet ?? null;
  } catch (error) {
    console.error("Error creating wallet:", error);
    throw error;
  }
};

const findCompanyByNameAndEmail = async (name, email) => {
  try {
    const [company] = await db
      .select()
      .from(companies)
      .where(or(eq(companies.name, name), eq(companies.email, email)))
      .limit(1);
    console.log(company, "COMPANY FOUND");
    return company ?? null;
  } catch (error) {
    console.error("Error finding company by name and email:", error);
    throw error;
  }
};
const CreateCompany = async (companyId, name, email, apiKeyHash) => {
  try {
    const [company] = await db
      .insert(companies)
      .values({
        id: companyId,
        name,
        email,
        apiKeyHash,
      })
      .returning({
        id: companies.id,
        name: companies.name,
        email: companies.email,
        status: companies.status,
        createdAt: companies.createdAt,
      });

    return company ?? null;
  } catch (err) {
    console.log("Error creating company:", err);
    throw err;
  }
};
module.exports = {
  findCompanyByNameAndEmail,
  CreateCompany,
  FundWalletTransaction,
  checkApiKeyHash,
  getWalletByCompanyId,
  createWalletMissing,
  DebitWalletTransaction,
};
