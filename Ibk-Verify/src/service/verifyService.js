const baseService = require("./BaseVerificationService.js");
const normalizer = require("../normalizer/normalizer.js");
const logModel = require("../model/LogModel.js");
const billingService = require("./Billing/billingGrpcService.js");
const generateUnique = require("../utils/generateUUId.js");
const AppError = require("../utils/error.js");
const { redisClient } = require("../config/redis.js");
const { incrementMetric } = require("../utils/metrics.js");
const { publishToQueue } = require("../config/rabbitmq.js");
const { injectTraceHeaders } = require("../utils/tracing.js");
// const {
//   enqueueelasticSchema,
// } = require("../../audit/search/search-index.publisher");
const crypto = require("crypto");

const CACHE_TTL = 3600;

const bvnService = new baseService("api/verify/bvn");
const ninService = new baseService("api/verify/nin");
const passportService = new baseService("api/verify/passport");
const LicenseService = new baseService("api/verify/license");
class VerificationService {
  async createVerificationJob(jobDetails) {
    const { type, id, company, idempotencyKey: clientKey } = jobDetails;

    const idempotencyKey = clientKey || generateUnique();
    console.log("company", company, type);
    if (idempotencyKey) {
      const existingLog = await logModel.findOne({ idempotencyKey });
      if (existingLog) {
        return { isDuplicate: true, job: existingLog };
      }
    }
    console.log(company);
    const log = await logModel.create({
      type,
      searchId: id,
      status: "PENDING",
      companyId: company._id,
      idempotencyKey,
    });

    const jobData = {
      logId: log._id,
      type,
      id,
      companyId: company._id.toString(),
      idempotencyKey,
    };
    publishToQueue(jobData, { headers: injectTraceHeaders() });

    return { isDuplicate: false, job: log };
  }

  async getJobStatus(logId, companyId) {
    const log = await logModel.findById(logId);

    if (!log) {
      throw new AppError("Verification record not found.", 404, "NOT_FOUND");
    }

    if (log.companyId.toString() !== companyId._id.toString()) {
      throw new AppError(
        "You are a thief not authorized to view this log record.",
        403,
        "FORBIDDEN",
      );
    }

    return {
      status: log.status,
      verificationId: log._id,
      data: log.status === "COMPLETED" ? log.responsePayload : null,
      error: log.status === "FAILED" ? log.errorMessage : null,
      createdAt: log.createdAt,
      completedAt: log.completedAt,
    };
  }

  async webhookHandler(payload) {
    const { verificationId, status, data, error } = payload;

    if (!payload) {
      throw new AppError(
        "Invalid webhook payload. Missing webhook details.",
        400,
        "BAD_REQUEST",
      );
    }
    const log = await logModel.findById(verificationId);
    if (!log) {
      throw new AppError(
        "Verification record not found for webhook.",
        404,
        "NOT_FOUND",
      );
    }

    if (log.status === "COMPLETED" || log.status === "FAILED") {
      console.log(
        `Webhook ignored: Job ${verificationId} is already ${log.status}`,
      );
      return;
    }

    if (status === "COMPLETED") {
      if (!data || typeof data !== "object") {
        await this.findAndUpdateLog(
          verificationId,
          "FAILED",
          null,
          "Invalid webhook payload: missing verification data",
        );
        return;
      }

      const normalizedData = await normalizer.normalize(log.type, data);
      await this.findAndUpdateLog(
        verificationId,
        "COMPLETED",
        normalizedData,
        null,
      );

      const cacheKey = this.generateCacheKey(log.type, log.searchId);
      try {
        await redisClient.set(cacheKey, JSON.stringify(data), {
          EX: CACHE_TTL,
        });
      } catch (redisError) {
        console.error("Redis SET error (graceful degradation):", redisError);
      }
    } else if (status === "FAILED") {
      await this.findAndUpdateLog(verificationId, "FAILED", null, error);
    }
  }

  async processJob(jobData) {
    const { logId, type, id, companyId, idempotencyKey } = jobData;

    const cacheKey = this.generateCacheKey(type, id);
    try {
      const cachedResult = await redisClient.get(cacheKey);
      if (cachedResult) {
        incrementMetric("hits");
        await this.findAndUpdateLog(
          logId,
          "COMPLETED",
          JSON.parse(cachedResult),
        );
        return;
      }
      incrementMetric("misses");
    } catch (redisError) {
      console.error("Redis GET error (graceful degradation):", redisError);
      incrementMetric("misses");
    }

    const billingResult = await billingService.chargeWallet(
      companyId,
      type.toUpperCase(),
      idempotencyKey,
    );

    try {
      const callbackUrl = `${process.env.GATEWAY_BASE_URL}/api/v1/webhook/gov-provider`;
      let providerResponse = null;
      switch (type.toUpperCase()) {
        case "NIN":
          providerResponse = await ninService.verify(id, callbackUrl, logId);
          break;
        case "BVN":
          providerResponse = await bvnService.verify(id, callbackUrl, logId);
          break;
        case "PASSPORT":
          providerResponse = await passportService.verify(
            id,
            callbackUrl,
            logId,
          );
          break;
        case "DRIVERS_LICENSE":
          providerResponse = await LicenseService.verify(
            id,
            callbackUrl,
            logId,
          );
          break;
        default:
          throw new Error("Invalid verification type");
      }

      if (providerResponse.status !== 202) {
        throw new Error(
          `Unexpected response from gov-provider: ${providerResponse.status}`,
        );
      }
    } catch (error) {
      console.error(
        `Verification job ${logId} failed to dispatch:`,
        error.message,
      );
      throw error;
    }
  }

  generateCacheKey(type, id) {
    const hash = crypto
      .createHash("sha256")
      .update(`${type}:${id}`)
      .digest("hex");
    return `verification:${hash}`;
  }

  async findAndUpdateLog(
    logId,
    status,
    responsePayload = null,
    errorMessage = null,
  ) {
    try {
      const update = {
        status,
        responsePayload,
        errorMessage,
        completedAt: new Date(),
      };
      if (responsePayload && responsePayload.photo) {
        update.responsePayload.photo = "[BASE64_IMAGE_TRUNCATED]";
      }
      await logModel.findByIdAndUpdate({ logId }, update, { new: true });
    } catch (logError) {
      console.error(`Failed to update log ${logId}:`, logError);
    }
  }
}

module.exports = new VerificationService();
