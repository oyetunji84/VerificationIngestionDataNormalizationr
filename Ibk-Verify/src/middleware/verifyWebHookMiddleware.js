const crypto = require("crypto");
const AppError = require("../utils/error");

const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET;
const TIMESTAMP_TOLERANCE = 5 * 60;

function verifyWebhook(req, res, next) {
  try {
    const signature = req.headers["x-webhook-signature"];
    const timestamp = req.headers["x-webhook-timestamp"];

    if (!signature || !timestamp) {
      throw new AppError("Unauthorized", 401, "WEBHOOK_UNAUTHORIZED");
    }

    const now = Math.floor(Date.now() / 1000);
    if (now - parseInt(timestamp) > TIMESTAMP_TOLERANCE) {
      throw new AppError("Unauthorized", 401, "WEBHOOK_UNAUTHORIZED");
    }

    const signedPayload = `${timestamp}.${req.rawBody}`;

    const expectedSignature = crypto
      .createHmac("sha256", WEBHOOK_SECRET)
      .update(signedPayload)
      .digest("hex");

    const trusted = crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature),
    );

    if (!trusted) {
      throw new AppError("Unauthorized", 401, "WEBHOOK_UNAUTHORIZED");
    }

    next();
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError("Unauthorized", 401, "WEBHOOK_UNAUTHORIZED");
  }
}

module.exports = verifyWebhook;
