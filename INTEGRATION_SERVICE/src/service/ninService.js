const HttpClient = require("../../utility/httpClient");
const config = require("../../config/environment");
const { debitWallet } = require("../service/walletService");
const { logVerification } = require("../service/historyService");
const { redisClient } = require("../infra/redisDb");
const NIN_COST_IN_NAIRA = 100;
const NIN_COST_IN_KOBO = NIN_COST_IN_NAIRA * 100;
const { publishJob } = require("../worker/publisher");
const jobRepository = require("../repository/jobRepository");
const {
  NotFoundError,
  UnauthorizedError,
  InsufficientFundsError,
  ExternalServiceError,
} = require("../../utility/error");
const { cacheHitCounter, cacheMissCounter } = require("../infra/observe");
const { toTraceHeaders } = require("../infra/traceContext");

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
  const { idempotencyKey, companyId, nin, apiKey, traceId, traceparent } =
    params;

  console.log("Starting paid NIN verification", {
    nin,
    companyId,
    idempotencyKey,
  });

  try {
    const debitResult = await debitWallet({
      amountInKobo: NIN_COST_IN_KOBO,
      idempotencyKey,
      companyId,
      description: "NIN verification request",
    });

    const job = await jobRepository.createJob({
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
        cacheHitCounter.inc();
        const updatedJob = await jobRepository.updateById(job._id, {
          status: "success",
          result: JSON.parse(cacheResult),
        });
        return {
          data: {
            status: updatedJob.status,
            id: updatedJob.id,
            idempotencyKey: updatedJob.IdempotencyKey,
          },
        };
      }
      cacheMissCounter.inc();
    }

    await publishJob(
      job.id,
      {
        nin,
        idempotencyKey,
        route: job.route,
        callBackUrl: `${process.env.GATEWAY_BASE_URL}/api/verify/webhook/gov-provider`,
      },
      0,
      toTraceHeaders({ traceId, traceparent }),
    );

    if (idempotencyKey) {
      await redisClient.set(
        `IDEMPOTENCY:${idempotencyKey}`,
        JSON.stringify({
          data: {
            status: job.status,
            id: job.id,
            idempotencyKey: job.IdempotencyKey,
          },
        }),
        { EX: 8400 },
      );
    }

    logVerification(
      {
        apiKey,
        serviceType: "NIN",
        status: "PARTIAL",
        requestId: idempotencyKey,
        amountInKobo: NIN_COST_IN_KOBO,
        walletTransactionId: debitResult.transaction.id,
      },
      { traceId, traceparent },
    ).catch((err) => {
      console.error("Failed to log NIN verification", {
        requestId: idempotencyKey,
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
    logVerification(
      {
        apiKey,
        serviceType: "NIN",
        status: "FAILED",
        requestId: idempotencyKey,
        errorMessage: err.message,
        errorCode: err.code || err.statusCode || "VERIFICATION_ERROR",
      },
      { traceId, traceparent },
    ).catch((logErr) => {
      console.error("Failed to log failed NIN verification", {
        requestId: idempotencyKey,
        error: logErr.message,
      });
    });

    throw err;
  }
};

module.exports = {
  paidVerifyNin,
};
