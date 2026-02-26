const { normalizeDocument } = require("../../normalizer/normalizer");
const { NotFoundError } = require("../../utility/error");
const JobModel = require("../models/JobModel");
// const {n}
//  const normalizedData = await normalizeDocument("BVN", rawResponse);

const getVerificationResult = async (id, companyId) => {
  if (!id) {
    throw new Error("ID is required");
  }
  const job = await JobModel.findOne({ _id: id, companyId });
  console.log(job);
  if (!job) {
    throw new NotFoundError("Job not found");
  }
  if (job.status === "pending" || job.status === "processing") {
    return {
      success: true,
      message: "Verification is still being processed",
      data: null,
    };
  }
  if (job.status === "failed") {
    return {
      success: false,
      message: "Verification failed",
      data: "was not successful money will be refunded",
    };
  }
  if (job.status === "success") {
    return {
      success: true,
      message: "Verification successful",
      data: normalizeDocument(job.verificationType, job.status),
    };
  }
  return {
    success: false,
    message: "Unknown job status",
    data: null,
  };
};
const handleWebhook = async (payload) => {
  const { verificationId, status, data, error } = payload;

  const log = await VerificationLog.findById(verificationId);
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
      await this.updateLog(
        verificationId,
        "FAILED",
        null,
        "Invalid webhook payload: missing verification data",
      );
      return;
    }

    const normalizedData = await normalizer.normalize(
      log.verificationType,
      data,
    );
    await this.updateLog(verificationId, "COMPLETED", normalizedData, null);

    const mode = log.mode || "basic_identity";
    const cacheKey = this.generateCacheKey(
      log.verificationType,
      log.searchId,
      mode,
    );
    try {
      await redisClient.set(cacheKey, JSON.stringify(data), {
        EX: CACHE_TTL_SECONDS,
      });
    } catch (redisError) {
      console.error("Redis SET error (graceful degradation):", redisError);
    }
  } else if (status === "FAILED") {
    await this.updateLog(verificationId, "FAILED", null, error);
  }
};
module.exports = {
  handleWebhook,
  getVerificationResult,
};
