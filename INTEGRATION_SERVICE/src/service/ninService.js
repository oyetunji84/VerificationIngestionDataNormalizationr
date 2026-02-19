const HttpClient = require("../../utility/httpClient");
const config = require("../../config/environment");
const { debitWallet } = require("../service/walletService");
const { logVerification } = require("../service/historyService");
const { normalizeDocument } = require("../../normalizer/normalizer");
const { redisClient } = require("../infra/redisDb");
const NIN_COST_IN_NAIRA = 100;
const NIN_COST_IN_KOBO = NIN_COST_IN_NAIRA * 100;

const {
  NotFoundError,
  UnauthorizedError,
  InsufficientFundsError,
  ExternalServiceError,
} = require("../../utility/error");
const {cacheHitCounter, cacheMissCounter}=require("../infra/observe")
const ninHttpClient = new HttpClient(config.NIN_PROVIDER_URL, {
  providerName: "NIN Provider",
  onError: (error) => {
    if (!error.response) {
      throw new ExternalServiceError("NIN Provider", error.message, {
        originalError: error,
      });
    }
    const { status, data } = error.response;

    if (status === 404) {
      throw new NotFoundError("NIN record", {
        provider: "NIN Provider",
        response: data,
      });
    }

    if (status === 402) {
      throw new InsufficientFundsError(
        "NIN Provider",
        data?.message || "Insufficient funds",
        {
          provider: "NIN Provider",
          response: data,
        },
      );
    }

    if (status === 401 || status === 403) {
      throw new UnauthorizedError(
        data?.message || "Access denied by NIN provider",
        {
          provider: "NIN Provider",
          response: data,
        },
      );
    }

    throw new ExternalServiceError(
      "NIN Provider",
      data?.message || error.message || "Unexpected provider error",
      {
        status,
        response: data,
      },
    );
  },
});
const verifyNIN = async (nin) => {
  console.log("Calling NIN provider", { nin });

  const response = await ninHttpClient.post("/verify/NIN", { nin });

  if (response.success && response.data) {
    return response.data;
  }

  throw new Error("Invalid response from NIN provider");
};

const paidVerifyNin = async (params) => {
  const { requestId, companyId, nin, apiKey } = params;
  console.log("Starting paid NIN verification", { nin, companyId, requestId });
  try {
    const debitResult = await debitWallet({
      amountInKobo: NIN_COST_IN_KOBO,
      requestId,
      companyId,
      description: "NIN verification request",
    });
        const cacheKey = nin ? `NIN:${nin}` : null;
        if (cacheKey) {
              const cacheResult = await redisClient.get(cacheKey);
              if (cacheResult) {
                // set the rate of tracking tthe hit and miss
                cacheHitCounter.inc();
                return JSON.parse(cacheResult);
              } else {
                // set the rate for tracking the miss but it must not disturb the flow
                cacheMissCounter.inc();
              }
            }
    
    const rawResponse = await verifyNIN(nin);
     
    const normalizedData = await normalizeDocument("NIN", rawResponse);
     if (cacheKey) {
          await redisClient.set(cacheKey, JSON.stringify(normalizedData), { EX: 8400 });
        }

    logVerification({
      apiKey,
      serviceType: "NIN",
      status: "SUCCESS",
      requestId,
      amountInKobo: NIN_COST_IN_KOBO,
      walletTransactionId: debitResult.transaction.id,
    }).catch((err) => {
      console.error("Failed to log NIN verification", {
        requestId,
        error: err.message,
      });
    });
    return {
      data: normalizedData,
    };
  } catch (err) {
    logVerification({
      apiKey,
      serviceType: "NIN",
      status: "FAILED",
      requestId,
      errorMessage: err.message,
      errorCode: err.code || err.statusCode || "VERIFICATION_ERROR",
    }).catch((err) => {
      console.error("Failed to log failed NIN verification", {
        requestId,
        error: err.message,
      });
    });

    // Let asyncHandler + error middleware deal with the response
    throw err;
  }
};
module.exports = {
  paidVerifyNin,
};
