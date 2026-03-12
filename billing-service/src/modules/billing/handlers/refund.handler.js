const grpc = require("@grpc/grpc-js");
const billingService = require("../service/billing.service");
const {
  replyWithError,
  replyWithInternalError,
} = require("../../../utils/grpc-status");

const SERVICE_TYPE_MAP = {
  SERVICE_TYPE_BVN: "BVN",
  SERVICE_TYPE_NIN: "NIN",
  SERVICE_TYPE_PASSPORT: "PASSPORT",
  SERVICE_TYPE_DRIVERS_LICENSE: "DRIVERS_LICENSE",
};

const refundWalletHandler = async (call, callback) => {
  const { organization_id, service_type, reference } = call.request;

  if (!organization_id) {
    return callback({
      code: grpc.status.INVALID_ARGUMENT,
      message: "organization_id is required",
    });
  }
  if (!service_type || service_type === "SERVICE_TYPE_UNSPECIFIED") {
    return callback({
      code: grpc.status.INVALID_ARGUMENT,
      message: "service_type is required and must not be UNSPECIFIED",
    });
  }
  if (!reference) {
    return callback({
      code: grpc.status.INVALID_ARGUMENT,
      message: "reference is required",
    });
  }

  const mappedServiceType = SERVICE_TYPE_MAP[service_type];
  if (!mappedServiceType) {
    return callback({
      code: grpc.status.INVALID_ARGUMENT,
      message: `Unknown service_type: ${service_type}`,
    });
  }

  try {
    const result = await billingService.refundWallet(
      organization_id,
      mappedServiceType,
      reference,
    );

    callback(null, {
      new_balance_kobo: Math.round(result.newBalance * 100),
    });
  } catch (err) {
    if (err.code) return replyWithError(callback, err.code, err.message);
    replyWithInternalError(callback, err);
  }
};

module.exports = { refundWalletHandler };
