const verificationService = require("../service/verifyService");
const asyncHandler = require("../utils/asyncHandler");
const AppError = require("../utils/error");
const verifyWebHookSignature = require("../utils/verifyWebhook.js");
exports.handleGovProviderWebhook = asyncHandler(async (req, res) => {
  try {
    await verifyWebHookSignature(
      req.headers["x-webhook-signature"],
      req.headers["x-webhook-timestamp"],
      req.body,
    );
  } catch (error) {
    console.error("Webhook signature verification failed:", error.message);
    throw new AppError("Invalid webhook", 400, "INVALID_SIGNATURE");
  }
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

  await verificationService.webhookHandler(payload);

  res.status(200).json({ status: "success", message: "Webhook processed" });
});
