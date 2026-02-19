const HttpClient = require("../../utility/httpClient");
const config = require("../../config/environment");
const { redisClient } = require("../infra/redisDb");
const { debitWallet } = require("../service/walletService");
const { logVerification } = require("../service/historyService");
const { normalizeDocument } = require("../../normalizer/normalizer");
const PASSPORT_COST_IN_NAIRA = 150;
const PASSPORT_COST_IN_KOBO = PASSPORT_COST_IN_NAIRA * 100;
const {
  NotFoundError,
  UnauthorizedError,
  InsufficientFundsError,
  ExternalServiceError,
} = require("../../utility/error");

const {cacheHitCounter, cacheMissCounter}=require("../infra/observe")

const passportHttpClient = new HttpClient(config.PASSPORT_PROVIDER_URL, {
  providerName: "Passport Provider",
  onError: (error) => {
    if (!error.response) {
      throw new ExternalServiceError("Passport Provider", error.message, {
        originalError: error,
      });
    }
    const { status, data } = error.response;

    if (status === 404) {
      throw new NotFoundError("Passport record", {
        provider: "Passport Provider",
        response: data,
      });
    }

    if (status === 402) {
      throw new InsufficientFundsError(
        "Passport Provider",
        data?.message || "Insufficient funds",
        {
          provider: "Passport Provider",
          response: data,
        },
      );
    }

    if (status === 401 || status === 403) {
      throw new UnauthorizedError(
        data?.message || "Access denied by Passport provider",
        {
          provider: "Passport Provider",
          response: data,
        },
      );
    }

    throw new ExternalServiceError(
      "Passport Provider",
      data?.message || error.message || "Unexpected provider error",
      {
        status,
        response: data,
      },
    );
  },
});
const verifyPassport = async (passportNumber) => {
  console.log("Calling Passport provider", { passportNumber });

  const response = await passportHttpClient.post("/verify/Passport", {
    passportNumber,
  });

  if (response.success && response.data) {
    return response.data;
  }

  throw new Error("Invalid response from Passport provider");
};

const paidVerifyPassport = async (params) => {
  const { requestId, companyId, passportNumber, apiKey } = params;
  console.log("Starting paid Passport verification", {
    passportNumber,
    companyId,
    requestId,
  });
  try {
    const debitResult = await debitWallet({
      amountInKobo: PASSPORT_COST_IN_KOBO,
      requestId,
      companyId,
      description: "Passport verification request",
    });
    
    const cacheKey = passportNumber ? `PASSPORT:${passportNumber}` : null;
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
    

    const rawResponse = await verifyPassport(passportNumber);

    const normalizedData = await normalizeDocument("PASSPORT", rawResponse);
    if (cacheKey) {
          await redisClient.set(cacheKey, JSON.stringify(normalizedData), { EX: 8400 });
        }
    logVerification({
      apiKey,
      serviceType: "PASSPORT",
      status: "SUCCESS",
      requestId,
      amountInKobo: PASSPORT_COST_IN_KOBO,
      walletTransactionId: debitResult.transaction.id,
    }).catch((err) => {
      console.error("Failed to log Passport verification", {
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
      serviceType: "PASSPORT",
      status: "FAILED",
      requestId,
      errorMessage: err.message,
      errorCode: err.code || err.statusCode || "VERIFICATION_ERROR",
    }).catch((err) => {
      console.error("Failed to log failed Passport verification", {
        requestId,
        error: err.message,
      });
    });

    // Let asyncHandler + error middleware deal with the response
    throw error;
  }
};
module.exports = {
  paidVerifyPassport,
};
