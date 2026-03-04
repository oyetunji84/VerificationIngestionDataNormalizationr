const { getChannel } = require("../infra/rabbitmq");
const { TOPOLOGY, publishToRetryQueue } = require("../infra/setUpQueue");
const {
  findJobById,
  findJobByIdAndUpdate,
} = require("../repository/jobRepository");
const axios = require("axios");
const {
  AppError,
  NotFoundError,
  InsufficientFundsError,
} = require("../utility/error.js");
const {
  verifyBvn,
  verifyLicense,
  verifyPassport,
  verifyNin,
} = require("../services/index.js");

const VERIFICATION_HANDLERS = {
  BVN: verifyBvn,
  NIN: verifyNin,
  LICENSE: verifyLicense,
  DRIVERS_LICENSE: verifyLicense,
  PASSPORT: verifyPassport,
};

async function runVerification(type, digit, companyId, IdempotencyKey) {
  const handler = VERIFICATION_HANDLERS[type];
  if (!handler) {
    throw new AppError(`Unknown verification type: "${type}"`, 400, false);
  }
  return handler(digit, companyId, IdempotencyKey);
}

async function startConsumer() {
  const channel = await getChannel();

  if (!channel) {
    console.error("[Consumer] RabbitMQ channel not available — retrying in 5s");
    setTimeout(startConsumer, 5000);
    return;
  }

  channel.prefetch(20);
  console.log("[Consumer] Waiting for jobs...");

  channel.consume(TOPOLOGY.QUEUES.MAIN, async (msg) => {
    if (!msg) return;

    let payload;
    try {
      payload = JSON.parse(msg.content.toString());
    } catch (e) {
      console.error(
        "[Consumer] Malformed message — dead lettering:",
        e.message,
      );
      channel.nack(msg, false, false);
      return;
    }

    const {
      dbId,
      id,
      callbackUrl,
      companyId,
      digit,
      type,
      IdempotencyKey,
      retryCount,
      webhookOnly,
      webhookBody,
      webhookRetryCount,
    } = payload.payload;

    if (webhookOnly) {
      console.log(
        `[Consumer] Webhook-only retry for job ${id} (webhook attempt ${webhookRetryCount}/${TOPOLOGY.MAX_RETRIES})`,
      );
      await safePostCallback(
        callbackUrl,
        webhookBody,
        id,
        webhookRetryCount,
        payload,
      );
      channel.ack(msg);
      return;
    }

    let job;
    try {
      job = await findJobById(id);
    } catch (e) {
      console.error(`[Consumer] DB error fetching job ${id}:`, e.message);
      await handleRetry({
        channel,
        msg,
        payload,
        retryCount,
        error: e,
        dbId,
        id,
        callbackUrl,
      });
      return;
    }

    if (!job) {
      console.warn(`[Consumer] Job ${id} not found in DB — discarding`);
      channel.ack(msg);
      return;
    }

    if (job.status === "success") {
      console.log(
        `[Consumer] Job ${id} already succeeded — discarding duplicate`,
      );
      channel.ack(msg);
      return;
    }

    try {
      await findJobByIdAndUpdate(dbId, "processing", retryCount);
    } catch (e) {
      console.error(
        `[Consumer] Could not mark job ${id} as processing:`,
        e.message,
      );
      await handleRetry({
        channel,
        msg,
        payload,
        retryCount,
        error: e,
        dbId,
        id,
        callbackUrl,
      });
      return;
    }

    let result;
    try {
      result = await runVerification(type, digit, companyId, IdempotencyKey);
    } catch (error) {
      // 1. Insufficient funds — business outcome, never retry verification
      if (error instanceof InsufficientFundsError) {
        console.log(
          `[Consumer] Job ${id} — insufficient funds for company ${companyId}`,
        );
        await safeUpdateJob(dbId, "success", retryCount, {
          outcome: "insufficient_funds",
        });
        await safePostCallback(
          callbackUrl,
          {
            id,
            status: "insufficient_funds",
            message:
              "Your wallet balance is insufficient. Please top up and try again.",
          },
          id,
          0,
          payload,
        );
        channel.ack(msg);
        return;
      }

      // 2. Record not found — business outcome, never retry verification
      if (error instanceof NotFoundError) {
        console.log(
          `[Consumer] Job ${id} — record not found: ${error.message}`,
        );
        await safeUpdateJob(dbId, "success", retryCount, {
          outcome: "not_found",
        });
        await safePostCallback(
          callbackUrl,
          {
            id,
            status: "not_found",
            message: error.message,
          },
          id,
          0,
          payload,
        );
        channel.ack(msg);
        return;
      }

      // 3. System error — retry the whole job
      const retryable = !(error instanceof AppError) || error.retryable;
      const exhausted = retryCount >= TOPOLOGY.MAX_RETRIES;
      const shouldRetry = retryable && !exhausted;

      console.error(
        `[Consumer] System error for job ${id} (attempt ${retryCount + 1}/${TOPOLOGY.MAX_RETRIES + 1}):`,
        error.message,
        error.stack,
      );

      if (shouldRetry) {
        await safeUpdateJob(dbId, "processing", retryCount + 1);
        await publishToRetryQueue(id, payload, retryCount + 1);
        channel.ack(msg);
      } else {
        console.error(
          `[Consumer] Job ${id} permanently failed — sending to DLQ`,
        );
        await safeUpdateJob(dbId, "failed", retryCount);
        await safePostCallback(
          callbackUrl,
          {
            id,
            status: "failed",
            message:
              "Verification could not be completed. Please contact support.",
            ...(error.statusCode && { code: error.statusCode }),
          },
          id,
          0,
          payload,
        );
        channel.nack(msg, false, false);
      }
      return;
    }

    await safeUpdateJob(dbId, "success", retryCount);
    await safePostCallback(
      callbackUrl,
      { id, status: "success", result },
      id,
      0,
      payload,
    );
    console.log(`[Consumer] ✓ Job ${id} completed successfully`);
    channel.ack(msg);
  });
}

async function handleRetry({
  channel,
  msg,
  payload,
  retryCount,
  error,
  dbId,
  id,
  callbackUrl,
}) {
  const exhausted = retryCount >= TOPOLOGY.MAX_RETRIES;

  if (exhausted) {
    console.error(
      `[Consumer] Job ${id} exhausted all retries — dead lettering`,
    );
    await safeUpdateJob(dbId, "failed", retryCount);
    await safePostCallback(
      callbackUrl,
      {
        id,
        status: "failed",
        message:
          "Verification could not be completed after multiple attempts. Please contact support.",
      },
      id,
      0,
      payload,
    );
    channel.nack(msg, false, false);
  } else {
    console.warn(
      `[Consumer] Job ${id} retrying (${retryCount + 1}/${TOPOLOGY.MAX_RETRIES}):`,
      error.message,
    );
    await safeUpdateJob(dbId, "processing", retryCount + 1);
    await publishToRetryQueue(id, payload, retryCount + 1);
    channel.ack(msg);
  }
}

async function safeUpdateJob(dbId, status, retryCount, meta = {}) {
  try {
    await findJobByIdAndUpdate(dbId, status, retryCount, meta);
  } catch (e) {
    console.error(
      `[Consumer] Could not update job ${dbId} to "${status}":`,
      e.message,
    );
  }
}

async function safePostCallback(
  callbackUrl,
  body,
  jobId,
  webhookRetryCount = 0,
  payload,
) {
  if (!callbackUrl) return;
  try {
    await axios.post(callbackUrl, body, { timeout: 8000 });
    console.log(`[Consumer] ✓ Callback delivered for job ${jobId}`);
  } catch (e) {
    console.error(
      `[Consumer] Callback POST to ${callbackUrl} failed (webhook attempt ${webhookRetryCount + 1}/${TOPOLOGY.MAX_RETRIES}):`,
      e.message,
    );

    const exhausted = webhookRetryCount >= TOPOLOGY.MAX_RETRIES;

    if (exhausted) {
      console.error(
        `[Consumer] Callback for job ${jobId} exhausted all webhook retries — giving up`,
        {
          callbackUrl,
          body,
        },
      );

      return;
    }

    const webhookOnlyPayload = {
      ...payload,
      payload: {
        ...payload.payload,
        webhookOnly: true,
        webhookBody: body,
        webhookRetryCount: webhookRetryCount + 1,
      },
    };

    console.warn(
      `[Consumer] Queuing webhook-only retry for job ${jobId} (webhook attempt ${webhookRetryCount + 1}/${TOPOLOGY.MAX_RETRIES})`,
    );
    await publishToRetryQueue(
      jobId,
      webhookOnlyPayload,
      payload.payload.retryCount,
    );
  }
}

module.exports = { startConsumer };
