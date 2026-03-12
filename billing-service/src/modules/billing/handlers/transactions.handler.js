const grpc = require("@grpc/grpc-js");
const billingService = require("../service/billing.service");
const {
  replyWithError,
  replyWithInternalError,
} = require("../../../utils/grpc-status");

const TX_TYPE_MAP = {
  CREDIT: "TRANSACTION_TYPE_CREDIT",
  DEBIT: "TRANSACTION_TYPE_DEBIT",
};

const TX_STATUS_MAP = {
  SUCCESS: "TRANSACTION_STATUS_SUCCESS",
  FAILED: "TRANSACTION_STATUS_FAILED",
  PENDING: "TRANSACTION_STATUS_PENDING",
};

const getTransactionsHandler = async (call, callback) => {
  const { organization_id, page, limit } = call.request;

  if (!organization_id) {
    return callback({
      code: grpc.status.INVALID_ARGUMENT,
      message: "organization_id is required",
    });
  }

  const resolvedPage = page > 0 ? page : 1;
  const resolvedLimit = limit > 0 ? limit : 20;

  try {
    const result = await billingService.getTransactions(
      organization_id,
      resolvedPage,
      resolvedLimit,
    );

    callback(null, {
      total: result.total,
      page: result.page,
      pages: result.pages,
      transactions: result.transactions.map((tx) => ({
        id: tx.id,
        type: TX_TYPE_MAP[tx.type] ?? "TRANSACTION_TYPE_UNSPECIFIED",
        status: TX_STATUS_MAP[tx.status] ?? "TRANSACTION_STATUS_UNSPECIFIED",
        amount_kobo: Math.round(tx.amount * 100).toString(), // int64 as string
        balance_before_kobo: Math.round(tx.balanceBefore * 100).toString(),
        balance_after_kobo: Math.round(tx.balanceAfter * 100).toString(),
        description: tx.description ?? "",
        reference: tx.reference ?? "",
        created_at: {
          seconds: Math.floor(
            new Date(tx.createdAt).getTime() / 1000,
          ).toString(),
          nanos: 0,
        },
      })),
    });
  } catch (err) {
    if (err.code) return replyWithError(callback, err.code, err.message);
    replyWithInternalError(callback, err);
  }
};

module.exports = { getTransactionsHandler };
