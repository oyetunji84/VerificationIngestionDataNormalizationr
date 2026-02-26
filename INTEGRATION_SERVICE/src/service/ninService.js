const HttpClient = require("../../utility/httpClient");
const config = require("../../config/environment");
const { debitWallet } = require("../service/walletService");
const { logVerification } = require("../service/historyService");
const { normalizeDocument } = require("../../normalizer/normalizer");
const JobModel = require("../models/JobModel");
const { redisClient } = require("../infra/redisDb");
const NIN_COST_IN_NAIRA = 100;
const NIN_COST_IN_KOBO = NIN_COST_IN_NAIRA * 100;
const { publishJob } = require("../worker/publisher");
const {
  NotFoundError,
  UnauthorizedError,
  InsufficientFundsError,
  ExternalServiceError,
} = require("../../utility/error");
const { cacheHitCounter, cacheMissCounter } = require("../infra/observe");
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
  const { idempotencyKey, companyId, nin, apiKey } = params;
  console.log("Starting paid NIN verification", {
    nin,
    companyId,
    idempotencyKey,
  });
  try {
    if (idempotencyKey) {
      const cacheResult = await redisClient.get(
        `IDEMPOTENCY:${idempotencyKey}`,
      );
      if (cacheResult) {
        console.log("Cache hit for idempotency key", { idempotencyKey });
        return JSON.parse(cacheResult);
      }
    }
    const debitResult = await debitWallet({
      amountInKobo: NIN_COST_IN_KOBO,
      idempotencyKey,
      companyId,
      description: "NIN verification request",
    });
    const job = await JobModel.create({
      status: "pending",
      IdempotencyKey: idempotencyKey,
      route: "/verify/NIN",
      payload: { nin, idempotencyKey },
      companyId,
    });
    const cacheKey = nin ? `NIN:${nin}` : null;
    if (cacheKey) {
      const cacheResult = await redisClient.get(cacheKey);
      if (cacheResult) {
        console.log("cache hitting for NIN verification", { ninNumber: nin });

        cacheHitCounter.inc();
        return await JobModel.findByIdAndUpdate(job._id, {
          status: "completed",
          result: JSON.parse(cacheResult),
        });
      } else {
        cacheMissCounter.inc();
      }
    }

    console.log("Created background job for NIN verification", { job });
    await publishJob(job.id, {
      nin,
      idempotencyKey,
      route: job.route,
      callBackUrl: `${process.env.GATEWAY_BASE_URL}/api/verify/webhook/gov-provider`,
    });

    if (idempotencyKey) {
      await redisClient.set(
        `IDEMPOTENCY:${idempotencyKey}`,
        JSON.stringify({ status: job.status, id: job.id }),
        {
          EX: 8400,
        },
      );
    }

    logVerification({
      apiKey,
      serviceType: "NIN",
      status: "PARTIAL",
      idempotencyKey,
      amountInKobo: NIN_COST_IN_KOBO,
      walletTransactionId: debitResult.transaction.id,
    }).catch((err) => {
      console.error("Failed to log NIN verification", {
        idempotencyKey,
        error: err.message,
      });
    });
    return {
      data: {
        status: job.status,
        id: job.id,
        idempotencyKey: job.IdempotencyKey,
      },
    };
  } catch (err) {
    logVerification({
      apiKey,
      serviceType: "NIN",
      status: "FAILED",
      idempotencyKey,
      errorMessage: err.message,
      errorCode: err.code || err.statusCode || "VERIFICATION_ERROR",
    }).catch((err) => {
      console.error("Failed to log failed NIN verification", {
        requestId,
        error: err.message,
      });
    });
    console.log(err, "at nin service  for paid verifyNIN");
    // Let asyncHandler + error middleware deal with the response
    throw err;
  }
};
module.exports = {
  paidVerifyNin,
};
