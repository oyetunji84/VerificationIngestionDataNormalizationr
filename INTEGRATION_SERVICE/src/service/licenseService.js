const HttpClient = require("../../utility/httpClient");
const config = require("../../config/environment");
const { redisClient } = require("../infra/redisDb");
const { debitWallet } = require("../service/walletService");
const { logVerification } = require("../service/historyService");
const { normalizeDocument } = require("../../normalizer/normalizer");
const LICENSE_COST_IN_NAIRA = 150;
const LICENSE_COST_IN_KOBO = LICENSE_COST_IN_NAIRA * 100;
const { cacheHitCounter, cacheMissCounter } = require("../infra/observe");

const {
  NotFoundError,
  UnauthorizedError,
  InsufficientFundsError,
  ExternalServiceError,
} = require("../../utility/error");

const licenseHttpClient = new HttpClient(config.DRIVERS_LICENSE_PROVIDER_URL, {
  providerName: "Drivers License Provider",
  onError: (error) => {
    if (!error.response) {
      throw new ExternalServiceError("Drivers License Provider", error.message, {
        originalError: error,
      });
    }
    const { status, data } = error.response;

    if (status === 404) {
      throw new NotFoundError("Drivers License record", {
        provider: "Drivers License Provider",
        response: data,
      });
    }

    if (status === 402) {
      throw new InsufficientFundsError(
        "Drivers License Provider",
        data?.message || "Insufficient funds",
        {
          provider: "Drivers License Provider",
          response: data,
        },
      );
    }

    if (status === 401 || status === 403) {
      throw new UnauthorizedError(
        data?.message || "Access denied by Drivers License provider",
        {
          provider: "Drivers License Provider",
          response: data,
        },
      );
    }

    throw new ExternalServiceError(
      "Drivers License Provider",
      data?.message || error.message || "Unexpected provider error",
      {
        status,
        response: data,
      },
    );
  },
});

const verifyLicense = async (licenseNumber) => {
  const response = await licenseHttpClient.post("/verify/License", {
    licenseNumber,
  });

  if (response.success && response.data) {
    return response.data;
  }

  throw new Error("Invalid response from Drivers License provider");
};

const paidVerifyLicense = async (params) => {
  const { companyId, licenseNumber, apiKey, traceId, traceparent } = params;
  const requestId = params.idempotencyKey || params.requestId;

  try {
    const debitResult = await debitWallet({
      amountInKobo: LICENSE_COST_IN_KOBO,
      idempotencyKey: requestId,
      companyId,
      description: "License verification request",
    });

    const cacheKey = licenseNumber ? `DRIVERS_LICENSE:${licenseNumber}` : null;
    if (cacheKey) {
      const cacheResult = await redisClient.get(cacheKey);
      if (cacheResult) {
        cacheHitCounter.inc();
        return { data: JSON.parse(cacheResult) };
      }
      cacheMissCounter.inc();
    }

    const rawResponse = await verifyLicense(licenseNumber);
    const normalizedData = await normalizeDocument("DRIVERS_LICENSE", rawResponse);

    if (cacheKey) {
      await redisClient.set(cacheKey, JSON.stringify(normalizedData), { EX: 8400 });
    }

    logVerification(
      {
        apiKey,
        serviceType: "DRIVERS_LICENSE",
        status: "SUCCESS",
        requestId,
        amountInKobo: LICENSE_COST_IN_KOBO,
        walletTransactionId: debitResult.transaction.id,
      },
      { traceId, traceparent },
    ).catch((err) => {
      console.error("Failed to log License verification", {
        requestId,
        error: err.message,
      });
    });

    return { data: normalizedData };
  } catch (err) {
    logVerification(
      {
        apiKey,
        serviceType: "DRIVERS_LICENSE",
        status: "FAILED",
        requestId,
        errorMessage: err.message,
        errorCode: err.code || err.statusCode || "VERIFICATION_ERROR",
      },
      { traceId, traceparent },
    ).catch((logErr) => {
      console.error("Failed to log failed License verification", {
        requestId,
        error: logErr.message,
      });
    });

    throw err;
  }
};

module.exports = {
  paidVerifyLicense,
};
