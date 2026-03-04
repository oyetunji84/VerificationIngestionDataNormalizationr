const { asyncHandler } = require("../utility/error");
const { findJobById, createJob } = require("../repository/jobRepository");
const { publishToMainQueue } = require("../infra/setUpQueue");
const { v4: uuidv4 } = require("uuid");

const verifyLicenseController = asyncHandler(async (req, res) => {
  const { id, callbackUrl, license_number } = req.validatedData;
  const companyId = req.company?.id;
  const requestId =
    req.header("x-idempotency-key") ||
    req.header("X-IDEMPOTENCY-KEY") ||
    uuidv4();

  const existingJob = await findJobById(id);
  if (existingJob) {
    return res.status(202).json({
      success: true,
      data: { id: existingJob.UserId, status: existingJob.status },
      message: "Request already accepted",
    });
  }

  const {
    _id: jobId,
    UserId,
    callbackUrl: jobCallbackUrl,
    retry_count: retryCount,
  } = await createJob({
    UserId: id,
    callbackUrl,
    companyId,
    type: "LICENSE",
    IdempotencyKey: requestId,
    status: "pending",
    payload: { license_number, callbackUrl, id },
    retry_count: 0,
  });

  const payload = {
    dbId: jobId,
    id: UserId,
    callbackUrl: jobCallbackUrl,
    companyId,
    digit: license_number,
    type: "LICENSE",
    IdempotencyKey: requestId,
    retryCount,
  };

  await publishToMainQueue(id, payload);

  return res.status(202).json({
    success: true,
    data: { id, status: "pending" },
    message: "Request accepted",
  });
});

module.exports = { verifyLicenseController };
