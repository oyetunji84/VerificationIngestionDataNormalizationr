const { publishToQueue } = require("../config/rabbitmq");
const asyncHandler = require("../utils/asyncHandler");

exports.verifyDL = asyncHandler(async (req, res) => {
  const { id, callbackUrl, verificationId } = req.body;
  const organization = req.organization;
  const idempotencyKey = req.headers["x-idempotency-key"];

  const jobData = {
    type: "DRIVERS_LICENSE",
    id,
    organizationId: organization._id,
    idempotencyKey,
    callbackUrl,
    verificationId,
  };

  publishToQueue(jobData);

  res.status(202).json({
    status: "PENDING",
    message:
      "Verification request accepted. Result will be sent to callbackUrl.",
  });
});
