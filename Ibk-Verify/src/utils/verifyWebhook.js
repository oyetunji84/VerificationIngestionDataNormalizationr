const crypto = require("crypto");
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET;
const TIMESTAMP_TOLERANCE_SECONDS = 300;

const verifyWebhookSignature = (webHookSig, webhookStamp, payload) => {
  const signatureHeader = webHookSig;
  const timestampHeader = webhookStamp;

  if (!signatureHeader || !timestampHeader) {
    throw new Error("this is not specified");
  }
  const now = Math.floor(Date.now() / 1000);
  const timestamp = parseInt(timestampHeader, 10);

  if (Math.abs(now - timestamp) > TIMESTAMP_TOLERANCE_SECONDS) {
    throw new Error("working again and try it");
  }

  const rawBody = payload;
  const signedPayload = `${timestampHeader}.${rawBody}`;

  const expectedSignature = crypto
    .createHmac("sha256", WEBHOOK_SECRET)
    .update(signedPayload)
    .digest("hex");

  const sigBuffer = Buffer.from(signatureHeader, "hex");
  const expectedBuffer = Buffer.from(expectedSignature, "hex");

  if (sigBuffer.length !== expectedBuffer.length) {
    throw new Error("Invalid signature");
  }

  if (!crypto.timingSafeEqual(sigBuffer, expectedBuffer)) {
    throw new Error("Invalid signature");
  }
};
module.exports = verifyWebhookSignature;
