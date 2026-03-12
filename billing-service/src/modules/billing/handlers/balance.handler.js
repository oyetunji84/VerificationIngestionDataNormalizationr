const grpc = require("@grpc/grpc-js");
const billingService = require("../service/billing.service");
const {
  replyWithError,
  replyWithInternalError,
} = require("../../../utils/grpc-status");

const WALLET_STATUS_MAP = {
  ACTIVE: "WALLET_STATUS_ACTIVE",
  SUSPENDED: "WALLET_STATUS_SUSPENDED",
};

const getBalanceHandler = async (call, callback) => {
  const { organization_id } = call.request;

  if (!organization_id) {
    return callback({
      code: grpc.status.INVALID_ARGUMENT,
      message: "organization_id is required",
    });
  }

  try {
    const result = await billingService.getBalance(organization_id);

    callback(null, {
      balance_kobo: Math.round(result.balance * 100),
      currency: result.currency,
      status: WALLET_STATUS_MAP[result.status] ?? "WALLET_STATUS_UNSPECIFIED",
    });
  } catch (err) {
    if (err.code) return replyWithError(callback, err.code, err.message);
    replyWithInternalError(callback, err);
  }
};

module.exports = { getBalanceHandler };
