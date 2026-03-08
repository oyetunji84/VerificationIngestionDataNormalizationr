const { sequelize } = require("../../config/Postgress");
const { redisClient } = require("../../config/redis");
const WalletRepository = require("../../repository/WalletRepository");
const TransactionRepository = require("../../repository/TransactionRepository");
const PRICING = require("../../utils/pricing");
const { trace, SpanStatusCode } = require("@opentelemetry/api");

const tracer = trace.getTracer("ibkverify-provider");

async function withBillingSpan(name, attributes, fn) {
  const span = tracer.startSpan(name, { attributes });
  try {
    const result = await fn();
    span.setStatus({ code: SpanStatusCode.OK });
    return result;
  } catch (error) {
    span.recordException(error);
    span.setStatus({ code: SpanStatusCode.ERROR, message: error.message });
    throw error;
  } finally {
    span.end();
  }
}

class BillingService {
  async findOrCreateWallet(companyId) {
    return withBillingSpan(
      "billing.find_or_create_wallet",
      { "billing.organization_id": companyId },
      () => WalletRepository.findOrCreate(companyId),
    );
  }

  async getBalance(companyId) {
    return withBillingSpan(
      "billing.get_balance",
      { "billing.organization_id": companyId },
      async () => {
        const wallet = await WalletRepository.findByCompanyId(companyId);
        if (!wallet) {
          const error = new Error("Wallet not found for this organization.");
          error.code = "404";
          throw error;
        }
        return wallet.balance;
      },
    );
  }

  async fundWallet(companyId, amount, reference, idempotencyKey) {
    return withBillingSpan(
      "billing.fund_wallet",
      {
        "billing.organization_id": companyId,
        "billing.amount": amount,
        "billing.idempotent": Boolean(idempotencyKey),
      },
      async () => {
        if (idempotencyKey) {
          const cached = await redisClient.get(
            `billing:fund:${idempotencyKey}`,
          );
          if (cached) return JSON.parse(cached);
        }

        if (amount <= 0) {
          const error = new Error("Funding amount must be positive.");
          error.code = "400";
          throw error;
        }

        const t = await sequelize.transaction();
        try {
          const wallet = await WalletRepository.findByCompanyIdWithLock(
            companyId,
            t,
          );
          if (!wallet) {
            const error = new Error("Wallet not found for this organization.");
            error.code = "404";
            throw error;
          }

          const balanceBefore = Number(wallet.balance);
          await WalletRepository.incrementBalance(wallet, amount, t);
          const balanceAfter = Number(wallet.balance);

          await TransactionRepository.create(
            {
              walletId: wallet.id,
              type: "CREDIT",
              amount,
              balanceBefore,
              balanceAfter,
              description: "Wallet Funding",
              reference: idempotencyKey || reference,
              status: "SUCCESS",
            },
            t,
          );

          await t.commit();

          const result = {
            newBalance: balanceAfter,
            reference: idempotencyKey || reference,
          };

          if (idempotencyKey) {
            await redisClient.set(
              `billing:fund:${idempotencyKey}`,
              JSON.stringify(result),
              { EX: 86400 },
            );
          }

          return result;
        } catch (error) {
          await t.rollback();
          throw error;
        }
      },
    );
  }

  async chargeWallet(companyId, serviceType, idempotencyKey) {
    return withBillingSpan(
      "billing.charge_wallet",
      {
        "billing.organization_id": companyId,
        "billing.service_type": serviceType,
        "billing.idempotent": Boolean(idempotencyKey),
      },
      async () => {
        if (idempotencyKey) {
          const cached = await redisClient.get(`billing:${idempotencyKey}`);
          if (cached) return JSON.parse(cached);
        }

        const cost = PRICING[serviceType];
        if (!cost) {
          return {
            success: false,
            error: "INVALID_SERVICE",
            message: `Unknown service type: ${serviceType}`,
          };
        }

        const t = await sequelize.transaction();
        try {
          const wallet = await WalletRepository.findByCompanyIdWithLock(
            companyId,
            t,
          );

          if (!wallet)
            return {
              success: false,
              error: "WALLET_NOT_FOUND",
              message: "Client wallet does not exist.",
            };
          if (wallet.status === "SUSPENDED")
            return {
              success: false,
              error: "WALLET_SUSPENDED",
              message: "Client wallet is suspended.",
            };
          if (Number(wallet.balance) < cost)
            return {
              success: false,
              error: "INSUFFICIENT_FUNDS",
              message: "Insufficient funds for this transaction.",
            };

          const balanceBefore = Number(wallet.balance);
          await WalletRepository.decrementBalance(wallet, cost, t);
          const balanceAfter = Number(wallet.balance);

          await TransactionRepository.create(
            {
              walletId: wallet.id,
              type: "DEBIT",
              amount: cost,
              balanceBefore,
              balanceAfter,
              description: `${serviceType} Verification`,
              reference: idempotencyKey,
            },
            t,
          );

          await t.commit();

          const result = { success: true, cost, newBalance: balanceAfter };

          if (idempotencyKey) {
            await redisClient.set(
              `billing:${idempotencyKey}`,
              JSON.stringify(result),
              { EX: 86400 },
            );
          }

          return result;
        } catch (error) {
          await t.rollback();
          throw error;
        }
      },
    );
  }

  async getHistory(companyId, page = 1, limit = 20) {
    return withBillingSpan(
      "billing.get_history",
      {
        "billing.organization_id": companyId,
        "billing.page": Number(page),
        "billing.limit": Number(limit),
      },
      async () => {
        const wallet = await WalletRepository.findByCompanyId(companyId);
        if (!wallet) {
          const error = new Error("Wallet not found for this organization.");
          error.code = "BILLING404";
          throw error;
        }

        const offset = (page - 1) * limit;
        const { count, rows } = await TransactionRepository.findAndCountAll({
          walletId: wallet.id,
          limit,
          offset,
        });

        return {
          total: count,
          page,
          pages: Math.ceil(count / limit),
          transactions: rows,
        };
      },
    );
  }

  async refundWallet(companyId, serviceType, reference) {
    return withBillingSpan(
      "billing.refund_wallet",
      {
        "billing.organization_id": companyId,
        "billing.service_type": serviceType,
        "billing.reference": reference || "",
      },
      async () => {
        const cost = PRICING[serviceType];
        if (!cost) {
          return {
            success: false,
            error: "INVALID_SERVICE",
            message: `Unknown service type: ${serviceType}`,
          };
        }

        const existingRefund = await TransactionRepository.findOne({
          reference,
          type: "CREDIT",
          description: `Refund for failed ${serviceType} Verification`,
        });

        if (existingRefund) {
          console.log(`Refund with reference ${reference} already processed.`);
          return { success: true, newBalance: existingRefund.balanceAfter };
        }

        const t = await sequelize.transaction();
        try {
          const wallet = await WalletRepository.findByCompanyIdWithLock(
            companyId,
            t,
          );
          if (!wallet) throw new Error("Wallet not found during refund.");

          const balanceBefore = Number(wallet.balance);
          await WalletRepository.incrementBalance(wallet, cost, t);
          const balanceAfter = Number(wallet.balance);

          await TransactionRepository.create(
            {
              walletId: wallet.id,
              type: "CREDIT",
              amount: cost,
              balanceBefore,
              balanceAfter,
              description: `Refund for failed ${serviceType} Verification`,
              reference,
            },
            t,
          );

          await t.commit();
          return { success: true, newBalance: balanceAfter };
        } catch (error) {
          await t.rollback();
          console.error("Refund failed:", error);
          throw error;
        }
      },
    );
  }
}

module.exports = new BillingService();
