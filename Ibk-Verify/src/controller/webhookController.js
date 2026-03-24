const verificationService = require("../service/verifyService");
const asyncHandler = require("../utils/asyncHandler");
const AppError = require("../utils/error");

exports.handleGovProviderWebhook = asyncHandler(async (req, res) => {
  const payload = JSON.parse(req.body);
  const { verificationId } = payload;
  if (!verificationId) {
    throw new AppError(
      "Missing verificationId in webhook payload",
      400,
      "INVALID_PAYLOAD",
    );
  }

  console.log(`Received webhook for verification ${verificationId}`);

  await verificationService.webhookHandler(req.body);

  res.status(200).json({ status: "success", message: "Webhook processed" });
});
