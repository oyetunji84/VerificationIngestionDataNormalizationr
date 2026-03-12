const grpc = require("@grpc/grpc-js");
const billingService = require("../service/billing.service");
const {
  replyWithError,
  replyWithInternalError,
} = require("../../../utils/grpc-status");

const fundWalletHandler = async (call, callback) => {
  const { organization_id, amount_kobo, idempotency_key } = call.request;

  // ── Input validation ────────────────────────────────────────────────────────
  if (!organization_id) {
    return callback({
      code: grpc.status.INVALID_ARGUMENT,
      message: "organization_id is required",
    });
  }
  if (!idempotency_key) {
    return callback({
      code: grpc.status.INVALID_ARGUMENT,
      message: "idempotency_key is required",
    });
  }

  // amount_kobo comes as a String from proto (longs: "String" in protoLoader config)
  const amountKobo = Number(amount_kobo);
  if (!amountKobo || amountKobo <= 0) {
    return callback({
      code: grpc.status.INVALID_ARGUMENT,
      message: "amount_kobo must be a positive integer",
    });
  }

  // Convert kobo → NGN decimal for the service layer
  const amountNgn = amountKobo / 100;

  try {
    const result = await billingService.fundWallet(
      organization_id,
      amountNgn,
      idempotency_key,
    );

    callback(null, {
      new_balance_kobo: Math.round(result.newBalance * 100),
      reference: result.reference,
    });
  } catch (err) {
    if (err.code) return replyWithError(callback, err.code, err.message);
    replyWithInternalError(callback, err);
  }
};

module.exports = { fundWalletHandler };
