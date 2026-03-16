const { sequelize } = require("../../../config/database");
const { redisClient } = require("../../../config/redis");
const { trace } = require("@opentelemetry/api");
const { withSpan } = require("../../../utils/span");
const walletRepository = require("../repository/wallet.repository");
const transactionRepository = require("../repository/transaction.repository");
const PRICING = require("../../../utils/pricing");
const logger = require("../../../utils/logger");

const tracer = trace.getTracer("billing-service");

const IDEMPOTENCY_TTL = 86400; // 24 hours — covers full queue retry window

class BillingService {
  async getIdempotencyCache(key) {
    try {
      const cached = await redisClient.get(key);
      return cached ? JSON.parse(cached) : null;
    } catch (err) {
      logger.warn(
        "Redis unavailable for idempotency check, proceeding without cache",
        {
          key,
          error: err.message,
        },
      );
      return null;
    }
  }

  async setIdempotencyCache(key, result) {
    try {
      await redisClient.set(key, JSON.stringify(result), "EX", IDEMPOTENCY_TTL);
    } catch (err) {
      logger.warn("Redis unavailable for idempotency store", {
        key,
        error: err.message,
      });
    }
  }

  async findOrCreateWallet(organizationId) {
    return withSpan(
      tracer,
      "billing.find_or_create_wallet",
      { "billing.organization_id": organizationId },
      () => walletRepository.findOrCreate(organizationId),
    );
  }

  async getBalance(organizationId) {
    return withSpan(
      tracer,
      "billing.get_balance",
      { "billing.organization_id": organizationId },
      async () => {
        const wallet =
          await walletRepository.findByOrganizationId(organizationId);
        if (!wallet) {
          const error = new Error("Wallet not found for this organization.");
          error.code = "WALLET_NOT_FOUND";
          throw error;
        }
        return {
          balance: Number(wallet.balance),
          currency: wallet.currency,
          status: wallet.status,
        };
      },
    );
  }

  async fundWallet(organizationId, amount, idempotencyKey) {
    return withSpan(
      tracer,
      "billing.fund_wallet",
      { "billing.organization_id": organizationId, "billing.amount": amount },
      async () => {
        const cacheKey = `billing:fund:${idempotencyKey}`;
        const cached = await this.getIdempotencyCache(cacheKey);
        if (cached) return cached;

        if (amount <= 0) {
          
          const error = new Error("Funding amount must be positive.");
          error.code = "INVALID_ARGUMENT";
          throw error;
        }

        const t = await sequelize.transaction();
        try {
          const wallet = await walletRepository.findByOrganizationIdWithLock(
            organizationId,
            t,
          );
          if (!wallet) {
            const error = new Error("Wallet not found for this organization.");
            error.code = "WALLET_NOT_FOUND";
            throw error;
          }

          const balanceBefore = Number(wallet.balance);
          await walletRepository.incrementBalance(wallet, amount, t);
          const balanceAfter = Number(wallet.balance);

          await transactionRepository.create(
            {
              walletId: wallet.id,
              type: "CREDIT",
              amount,
              balanceBefore,
              balanceAfter,
              description: "Wallet Funding",
              reference: idempotencyKey,
              status: "SUCCESS",
            },
            t,
          );

          await t.commit();

          const result = {
            newBalance: balanceAfter,
            reference: idempotencyKey,
          };
          await this.setIdempotencyCache(cacheKey, result);
          return result;
        } catch (error) {
          await t.rollback();
          throw error;
        }
      },
    );
  }

  async chargeWallet(organizationId, serviceType, idempotencyKey) {
    return withSpan(
      tracer,
      "billing.charge_wallet",
      {
        "billing.organization_id": organizationId,
        "billing.service_type": serviceType,
      },
      async () => {
        const cacheKey = `billing:charge:${idempotencyKey}`;
        const cached = await this.getIdempotencyCache(cacheKey);
        if (cached) return cached;

        const cost = PRICING[serviceType];
        if (!cost) {
          const error = new Error(`Unknown service type: ${serviceType}`);
          error.code = "INVALID_SERVICE";
          throw error;
        }

        const t = await sequelize.transaction();
        try {
          const wallet = await walletRepository.findByOrganizationIdWithLock(
            organizationId,
            t,
          );

          if (!wallet) {
            const error = new Error("Wallet not found.");
            error.code = "WALLET_NOT_FOUND";
            throw error;
          }
          if (wallet.status === "SUSPENDED") {
            const error = new Error("Wallet is suspended.");
            error.code = "WALLET_SUSPENDED";
            throw error;
          }
          if (Number(wallet.balance) < cost) {
            const error = new Error("Insufficient funds.");
            error.code = "INSUFFICIENT_FUNDS";
            throw error;
          }

          const balanceBefore = Number(wallet.balance);
          await walletRepository.decrementBalance(wallet, cost, t);
          const balanceAfter = Number(wallet.balance);

          await transactionRepository.create(
            {
              walletId: wallet.id,
              type: "DEBIT",
              amount: cost,
              balanceBefore,
              balanceAfter,
              description: `${serviceType} Verification`,
              reference: idempotencyKey,
              status: "SUCCESS",
            },
            t,
          );

          await t.commit();

          const result = { cost, newBalance: balanceAfter };
          await this.setIdempotencyCache(cacheKey, result);
          return result;
        } catch (error) {
          await t.rollback();
          throw error;
        }
      },
    );
  }

  async refundWallet(organizationId, serviceType, reference) {
    return withSpan(
      tracer,
      "billing.refund_wallet",
      {
        "billing.organization_id": organizationId,
        "billing.service_type": serviceType,
      },
      async () => {
        const cost = PRICING[serviceType];
        if (!cost) {
          const error = new Error(`Unknown service type: ${serviceType}`);
          error.code = "INVALID_SERVICE";
          throw error;
        }

        // Refunds use the transaction record as the dedup check —
        // the reference is the original job's idempotency key prefixed with "refund_".
        // This is a natural fit: if the refund transaction record exists, it already happened.
        const existingRefund = await transactionRepository.findOne({
          reference,
          type: "CREDIT",
          description: `Refund for failed ${serviceType} Verification`,
        });
        if (existingRefund) {
          return { newBalance: Number(existingRefund.balanceAfter) };
        }

        const t = await sequelize.transaction();
        try {
          const wallet = await walletRepository.findByOrganizationIdWithLock(
            organizationId,
            t,
          );
          if (!wallet) {
            throw new Error("Wallet not found during refund.");
          }

          const balanceBefore = Number(wallet.balance);
          await walletRepository.incrementBalance(wallet, cost, t);
          const balanceAfter = Number(wallet.balance);

          await transactionRepository.create(
            {
              walletId: wallet.id,
              type: "CREDIT",
              amount: cost,
              balanceBefore,
              balanceAfter,
              description: `Refund for failed ${serviceType} Verification`,
              reference,
              status: "SUCCESS",
            },
            t,
          );

          await t.commit();
          return { newBalance: balanceAfter };
        } catch (error) {
          await t.rollback();
          throw error;
        }
      },
    );
  }

  async getTransactions(organizationId, page = 1, limit = 20) {
    return withSpan(
      tracer,
      "billing.get_transactions",
      { "billing.organization_id": organizationId, "billing.page": page },
      async () => {
        const wallet =
          await walletRepository.findByOrganizationId(organizationId);
        if (!wallet) {
          const error = new Error("Wallet not found for this organization.");
          error.code = "WALLET_NOT_FOUND";
          throw error;
        }

        const offset = (page - 1) * limit;
        const { count, rows } = await transactionRepository.findAndCountAll({
          walletId: wallet.id,
          limit,
          offset,
        });

        return {
          total: count,
          page,
          pages: Math.ceil(count / limit),
          transactions: rows.map((tx) => ({
            id: tx.id,
            type: tx.type,
            amount: Number(tx.amount),
            balanceBefore: Number(tx.balanceBefore),
            balanceAfter: Number(tx.balanceAfter),
            description: tx.description,
            reference: tx.reference,
            status: tx.status,
            createdAt: tx.createdAt.toISOString(),
          })),
        };
      },
    );
  }
}

module.exports = new BillingService();
