const grpc = require("@grpc/grpc-js");
const { getBillingClient } = require("../../config/billingClient");

const deadlineMs = (ms) => new Date(Date.now() + ms);

const MUTATING_DEADLINE_MS = 1_000;
const READONLY_DEADLINE_MS = 500;

const callRpc = (methodName, request, deadline) => {
  return new Promise((resolve, reject) => {
    const client = getBillingClient();
    const metadata = new grpc.Metadata();
    const options = { deadline };

    client[methodName](request, metadata, options, (err, response) => {
      if (err) {
        const enriched = new Error(err.details || err.message);
        enriched.grpcCode = err.code;
        enriched.grpcMessage = err.details || err.message;
        return reject(enriched);
      }
      resolve(response);
    });
  });
};

const findOrCreateWallet = async (organizationId) => {
  const res = await callRpc(
    "FindOrCreateWallet",
    { organization_id: organizationId },
    deadlineMs(MUTATING_DEADLINE_MS),
  );
  return {
    walletId: res.wallet_id,
    organizationId: res.organization_id,
    balance: Number(res.balance_kobo) / 100,
    currency: res.currency,
    status: res.status,
    created: res.created,
  };
};

const getBalance = async (organizationId) => {
  const res = await callRpc(
    "GetBalance",
    { organization_id: organizationId },
    deadlineMs(READONLY_DEADLINE_MS),
  );
  return {
    balance: Number(res.balance_kobo) / 100,
    currency: res.currency,
    status: res.status,
  };
};

const chargeWallet = async (organizationId, serviceType, idempotencyKey) => {
  const res = await callRpc(
    "ChargeWallet",
    {
      organization_id: organizationId,
      service_type: `SERVICE_TYPE_${serviceType}`, // "BVN"
      idempotency_key: idempotencyKey,
    },
    deadlineMs(MUTATING_DEADLINE_MS),
  );
  return {
    cost: Number(res.cost_kobo) / 100,
    newBalance: Number(res.new_balance_kobo) / 100,
  };
};

const fundWallet = async (organizationId, amount, idempotencyKey) => {
  const res = await callRpc(
    "FundWallet",
    {
      organization_id: organizationId,
      amount_kobo: Math.round(amount * 100).toString(),
      idempotency_key: idempotencyKey,
    },
    deadlineMs(MUTATING_DEADLINE_MS),
  );
  return {
    newBalance: Number(res.new_balance_kobo) / 100,
    reference: res.reference,
  };
};

const refundWallet = async (organizationId, serviceType, reference) => {
  const res = await callRpc(
    "RefundWallet",
    {
      organization_id: organizationId,
      service_type: `SERVICE_TYPE_${serviceType}`,
      reference,
    },
    deadlineMs(MUTATING_DEADLINE_MS),
  );
  return {
    newBalance: Number(res.new_balance_kobo) / 100,
  };
};

const getTransactions = async (organizationId, page = 1, limit = 20) => {
  const res = await callRpc(
    "GetTransactions",
    { organization_id: organizationId, page, limit },
    deadlineMs(READONLY_DEADLINE_MS),
  );
  return {
    total: res.total,
    page: res.page,
    pages: res.pages,
    transactions: res.transactions.map((tx) => ({
      id: tx.id,
      type: tx.type,
      status: tx.status,
      amount: Number(tx.amount_kobo) / 100,
      balanceBefore: Number(tx.balance_before_kobo) / 100,
      balanceAfter: Number(tx.balance_after_kobo) / 100,
      description: tx.description,
      reference: tx.reference,
      createdAt: tx.created_at
        ? new Date(Number(tx.created_at.seconds) * 1000).toISOString()
        : null,
    })),
  };
};

module.exports = {
  findOrCreateWallet,
  getBalance,
  chargeWallet,
  fundWallet,
  refundWallet,
  getTransactions,
};
