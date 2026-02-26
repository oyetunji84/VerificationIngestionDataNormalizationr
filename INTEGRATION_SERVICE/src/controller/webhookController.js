const verificationService = require("../service/verificationService");
const { asyncHandler } = require("../../utility/error");
const AppError = require("../../utility/error").AppError;
exports.handleGovProviderWebhook = asyncHandler(async (req, res) => {
  const { verificationId } = req.body;
  if (!verificationId) {
    throw new AppError(
      "Missing verificationId in webhook payload",
      400,
      "INVALID_PAYLOAD",
    );
  }

  await verificationService.handleWebhook(req.body);

  res.status(200).json({ status: "success", message: "Webhook processed" });
});
