const HttpClient = require('../../utility/httpClient');
const config = require('../../config/environment');
const { debitWallet } = require('../service/walletService');
const { logVerification } = require('../service/historyService');
const { normalizeDocument } = require('../../normalizer/normalizer');
const { asyncHandler } = require('../../utility/error');

const { redisClient } = require("../infra/redisDb");
const { v4: uuidv4 } = require('uuid');
const BVN_COST_IN_NAIRA = 150;
const BVN_COST_IN_KOBO = BVN_COST_IN_NAIRA * 100;
const {cacheHitCounter, cacheMissCounter}=require("../infra/observe")

const {
  NotFoundError,
  UnauthorizedError,
  InsufficientFundsError,
  ExternalServiceError,
} = require("../../utility/error");

const bvnHttpClient = new HttpClient(config.BVN_PROVIDER_URL, {
  providerName: "BVN Provider",
  onError: (error) => {
    if (!error.response) {
      throw new ExternalServiceError("BVN Provider", error.message, {
        originalError: error,
      });
    }
    const { status, data } = error.response;

    if (status === 404) {
      throw new NotFoundError("BVN record", {
        provider: "BVN Provider",
        response: data,
      });
    }

    if (status === 402) {
      throw new InsufficientFundsError(
        "BVN Provider",
        data?.message || "Insufficient funds",
        {
          provider: "BVN Provider",
          response: data,
        },
      );
    }

    if (status === 401 || status === 403) {
      throw new UnauthorizedError(
        data?.message || "Access denied by BVN provider",
        {
          provider: "BVN Provider",
          response: data,
        },
      );
    }

    throw new ExternalServiceError(
      "BVN Provider",
      data?.message || error.message || "Unexpected provider error",
      {
        status,
        response: data,
      },
    );
  },
});
const verifyBVN = async (bvn) => {
  console.log("Calling BVN provider", { bvn });

  const response = await bvnHttpClient.post("/verify/BVN", { bvn });

  if (response.success && response.data) {
    return response.data;
  }

  throw new Error("Invalid response from BVN provider");
};
const paidVerifyBVN = async (params) => {
  const { requestId, companyId, bvn, apiKey } = params;
  console.log("Starting paid BVN verification", { bvn, companyId, requestId });
  try {
    const debitResult = await debitWallet({
      amountInKobo: BVN_COST_IN_KOBO,
      requestId,
      companyId,
      description: "BVN verification request",
    });
     const cacheKey = bvn ? `BVN:${bvn}` : null;
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
    const rawResponse = await verifyBVN(bvn);
     
    const normalizedData = await normalizeDocument("BVN", rawResponse);
    if (cacheKey) {
          await redisClient.set(cacheKey, JSON.stringify(normalizedData), { EX: 8400 });
        }

    logVerification({
      apiKey,
      serviceType: "BVN",
      status: "SUCCESS",
      requestId,
      amountInKobo: BVN_COST_IN_KOBO,
      walletTransactionId: debitResult.transaction.id,
    }).catch((err) => {
      console.error("Failed to log BVN verification", {
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
      serviceType: "BVN",
      status: "FAILED",
      requestId,
      errorMessage: err.message,
      errorCode: err.code || err.statusCode || "VERIFICATION_ERROR",
    }).catch((err) => {
      console.error("Failed to log failed BVN verification", {
        requestId,
        error: err.message,
      });
    });

    
    throw err;
  }
};

module.exports = {
  paidVerifyBVN,
};