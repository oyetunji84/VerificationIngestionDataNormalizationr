const grpc = require("@grpc/grpc-js");
const billingService = require("../service/billing.service");
const { replyWithInternalError } = require("../../../utils/grpc-status");

const WALLET_STATUS_MAP = {
  ACTIVE: "WALLET_STATUS_ACTIVE",
  SUSPENDED: "WALLET_STATUS_SUSPENDED",
};

const findOrCreateWalletHandler = async (call, callback) => {
  const { organization_id } = call.request;

  if (!organization_id) {
    return callback({
      code: grpc.status.INVALID_ARGUMENT,
      message: "organization_id is required",
    });
  }

  try {
    const { wallet, created } =
      await billingService.findOrCreateWallet(organization_id);

    callback(null, {
      wallet_id: wallet.id,
      organization_id: wallet.organizationId,
      balance_kobo: Math.round(Number(wallet.balance) * 100),
      currency: wallet.currency,
      status: WALLET_STATUS_MAP[wallet.status] ?? "WALLET_STATUS_UNSPECIFIED",
      created,
    });
  } catch (err) {
    replyWithInternalError(callback, err);
  }
};

module.exports = { findOrCreateWalletHandler };
