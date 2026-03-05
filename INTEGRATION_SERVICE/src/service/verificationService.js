const { NotFoundError, AppError } = require("../../utility/error");
const jobRepository = require("../repository/jobRepository");

const getVerificationResult = async (id, companyId) => {
  if (!id) {
    throw new Error("ID is required");
  }

  const job = await jobRepository.findByIdAndCompanyId(id, companyId);
  if (!job) {
    throw new NotFoundError("Job");
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
      data: job.result || null,
    };
  }

  return {
    success: false,
    message: "Unknown job status",
    data: null,
  };
};

const handleWebhook = async () => {
  throw new AppError("Gov provider webhook handling is not implemented", 501, true);
};

module.exports = {
  handleWebhook,
  getVerificationResult,
};
