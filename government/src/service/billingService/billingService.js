const { redisClient } = require("../../config/redis");
const PRICING = require("../../utils/pricing");
const { trace, SpanStatusCode } = require("@opentelemetry/api");
const billingRepository = require("../../repository/billingRepository");

const tracer = trace.getTracer("gov-provider");

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
  async findOrCreateWallet(organizationId) {
    return withBillingSpan(
      "billing.find_or_create_wallet",
      { "billing.organization_id": organizationId },
      () => billingRepository.findOrCreateWallet(organizationId),
    );
  }

  async getBalance(organizationId) {
    return withBillingSpan(
      "billing.get_balance",
      { "billing.organization_id": organizationId },
      async () => {
        const wallet = await billingRepository.findWallet(organizationId);
        if (!wallet) {
          const error = new Error("Wallet not found for this organization.");
          error.code = "BILLING404";
          throw error;
        }
        return wallet.balance;
      },
    );
  }

  async fundWallet(organizationId, amount, reference, idempotencyKey) {
    return withBillingSpan(
      "billing.fund_wallet",
      {
        "billing.organization_id": organizationId,
        "billing.amount": amount,
        "billing.idempotent": Boolean(idempotencyKey),
      },
      async () => {
        if (idempotencyKey) {
          const cachedResult = await redisClient.get(
            `billing:fund:${idempotencyKey}`,
          );
          if (cachedResult) return JSON.parse(cachedResult);
        }

        if (amount <= 0) {
          const error = new Error("Funding amount must be positive.");
          error.code = "BILLING400";
          throw error;
        }

        const t = await billingRepository.beginTransaction();
        try {
          const wallet = await billingRepository.findWallet(organizationId, t);
          if (!wallet) {
            const error = new Error("Wallet not found for this organization.");
            error.code = "404";
            throw error;
          }

          const balanceBefore = Number(wallet.balance);
          await billingRepository.incrementWalletBalance(wallet, amount, t);
          const balanceAfter = Number(wallet.balance);

          await billingRepository.createTransaction(
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

  async chargeWallet(organizationId, serviceType, idempotencyKey) {
    return withBillingSpan(
      "billing.charge_wallet",
      {
        "billing.organization_id": organizationId,
        "billing.service_type": serviceType,
        "billing.idempotent": Boolean(idempotencyKey),
      },
      async () => {
        if (idempotencyKey) {
          const cachedResult = await redisClient.get(
            `billing:${idempotencyKey}`,
          );
          if (cachedResult) return JSON.parse(cachedResult);
        }

        const cost = PRICING[serviceType];
        if (!cost) {
          return {
            success: false,
            error: "INVALID_SERVICE",
            message: `Unknown service type: ${serviceType}`,
          };
        }

        const t = await billingRepository.beginTransaction();
        try {
          const wallet = await billingRepository.findWallet(organizationId, t);

          if (!wallet) {
            await t.rollback();
            return {
              success: false,
              error: "WALLET_NOT_FOUND",
              message: "Client wallet does not exist.",
            };
          }
          if (wallet.status === "SUSPENDED") {
            await t.rollback();
            return {
              success: false,
              error: "WALLET_SUSPENDED",
              message: "Client wallet is suspended.",
            };
          }
          if (Number(wallet.balance) < cost) {
            await t.rollback();
            return {
              success: false,
              error: "INSUFFICIENT_FUNDS",
              message: "Insufficient funds for this transaction.",
            };
          }

          const balanceBefore = Number(wallet.balance);
          await billingRepository.decrementWalletBalance(wallet, cost, t);
          const balanceAfter = Number(wallet.balance);

          await billingRepository.createTransaction(
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
          if (error.code === "SYS_WALLET_MISSING") {
            console.error("CRITICAL: System revenue wallet is missing!", error);
            return {
              success: false,
              error: "SERVICE_UNAVAILABLE",
              message:
                "The service is temporarily unavailable due to a configuration issue. Please try again later.",
            };
          }
          throw error;
        }
      },
    );
  }

  async getHistory(organizationId, page = 1, limit = 20) {
    return withBillingSpan(
      "billing.get_history",
      {
        "billing.organization_id": organizationId,
        "billing.page": Number(page),
        "billing.limit": Number(limit),
      },
      async () => {
        const wallet = await billingRepository.findWallet(organizationId);
        if (!wallet) {
          const error = new Error("Wallet not found for this organization.");
          error.code = "BILLING404";
          throw error;
        }

        const { count, rows } = await billingRepository.getTransactionHistory(
          wallet.id,
          page,
          limit,
        );

        return {
          total: count,
          page,
          pages: Math.ceil(count / limit),
          transactions: rows,
        };
      },
    );
  }
}

module.exports = new BillingService();
