const {
  getChannel,
  GOV_QUEUE,
  publishToRetryQueue,
} = require("../config/rabbitmq");
const axios = require("axios");
const ninService = require("../service/NinService/ninService");
const bvnService = require("../service/BvnService/bvnService");
const passportService = require("../service/PassportService/passportService");
const licenseService = require("../service/LicenseService/LicenseService");

const MAX_RETRIES = 5;

const VERIFICATION_SERVICES = {
  NIN: ninService,
  BVN: bvnService,
  PASSPORT: passportService,
  DRIVERS_LICENSE: licenseService,
};

const runVerification = async (type, id, organization, idempotencyKey) => {
  const service = VERIFICATION_SERVICES[type];
  if (!service) throw new Error(`Invalid verification type: ${type}`);
  return service.verify(id, organization, idempotencyKey);
};

const sendWebhook = async (callbackUrl, verificationId, result, error) => {
  await axios.post(callbackUrl, {
    verificationId,
    status: error ? "FAILED" : "COMPLETED",
    data: result?.data ?? null,
    error: error ?? null,
  });
};

const processJob = async (jobData) => {
  const {
    type,
    id,
    organizationId,
    idempotencyKey,
    callbackUrl,
    verificationId,
  } = jobData;

  const resolvedVerificationId =
    verificationId || idempotencyKey || `${type}:${id}`;
  const organization = { _id: organizationId };

  let result = null;
  let verificationError = null;

  try {
    result = await runVerification(type, id, organization, idempotencyKey);
  } catch (err) {
    console.error(
      `Verification failed for ${resolvedVerificationId}:`,
      err.message,
    );
    verificationError = err.message;
  }

  if (!callbackUrl) {
    console.warn(
      `No callbackUrl for job ${resolvedVerificationId}. Skipping webhook.`,
    );
    return;
  }

  console.log(
    `Sending webhook to ${callbackUrl} for ${resolvedVerificationId}`,
  );
  await sendWebhook(
    callbackUrl,
    resolvedVerificationId,
    result,
    verificationError,
  );
  console.log(`Webhook sent successfully for ${resolvedVerificationId}`);
};

const handleRetryOrDead = (channel, msg, jobData, error) => {
  const { retryCount = 0, verificationId, idempotencyKey, type, id } = jobData;
  const resolvedVerificationId =
    verificationId || idempotencyKey || `${type}:${id}`;

  if (retryCount < MAX_RETRIES) {
    const delay = Math.pow(2, retryCount) * 1000;
    console.log(
      `Retrying webhook for ${resolvedVerificationId} in ${delay}ms (Attempt ${retryCount + 1}/${MAX_RETRIES})`,
    );
    publishToRetryQueue({ ...jobData, retryCount: retryCount + 1 }, delay);
    channel.ack(msg);
  } else {
    console.error(
      `Job ${resolvedVerificationId} failed permanently after ${MAX_RETRIES} retries.`,
    );
    channel.nack(msg, false, false); // Send to dead-letter queue
  }
};

const startWorker = () => {
  const channel = getChannel();

  if (!channel) {
    console.error("RabbitMQ channel not available. Retrying in 5s...");
    setTimeout(startWorker, 5000);
    return;
  }

  console.log("Gov Provider Verification worker started. Waiting for jobs...");

  channel.consume(
    GOV_QUEUE,
    async (msg) => {
      if (!msg) return;

      const jobData = JSON.parse(msg.content.toString());

      try {
        await processJob(jobData);
        channel.ack(msg);
      } catch (err) {
        console.error("Job processing error:", err.message);
        handleRetryOrDead(channel, msg, jobData, err);
      }
    },
    { noAck: false },
  );
};

module.exports = { startWorker }; // Fix 7: export so it can actually be started
