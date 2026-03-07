const verifyService = require("../service/verifyService");
const asyncHandler = require("../utils/asyncHandler");

exports.queueVerification = asyncHandler(async (req, res) => {
  const { type, id } = req.body;
  const company = req.company;

  const idempotencyKey =
    req.headers["x-idempotency-key"] || req.body.idempotencyKey;

  const result = await verifyService.createVerificationJob({
    type,
    id,
    company,
    idempotencyKey,
  });

  if (result.isDuplicate) {
    return res.status(200).json({
      status: result.job.status,
      message:
        "This request has already been processed. Returning existing status.",
      verificationId: result.job._id,
      identity: result.job.searchId,
    });
  }

  res.status(202).json({
    status: "PENDING",
    message: "Verification request has been accepted and is being processed.",
    verificationId: result.job._id,
    identity: id,
  });
});

exports.getVerificationStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const company = req.company;

  const status = await verifyService.getJobStatus(id, company);

  res.status(200).json(status);
});
