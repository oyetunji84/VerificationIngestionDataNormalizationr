require("dotenv").config();

const { getChannel } = require("../infra/rabbitmq");
const { TOPOLOGY } = require("../infra/setUpQueue");
const { logVerification } = require("../service/historyService");
const { redisClient } = require("../infra/redisDb");
const jobRepository = require("../repository/jobRepository");

const NIN_COST_IN_NAIRA = 100;
const NIN_COST_IN_KOBO = NIN_COST_IN_NAIRA * 100;

async function startDeadConsumer() {
  const channel = await getChannel();

  channel.prefetch(10);
  console.log("[DeadConsumer] Listening for dead-lettered jobs...");

  channel.consume(TOPOLOGY.JOB.QUEUES.DEAD, async (msg) => {
    if (!msg) return;

    let jobId;
    let payload;
    let retryCount;

    try {
      ({ jobId, payload, retryCount } = JSON.parse(msg.content.toString()));
    } catch (e) {
      console.error("Failed to parse dead message");
      channel.ack(msg);
      return;
    }

    try {
      await jobRepository.updateById(jobId, {
        status: "failed",
        retry_count: retryCount,
        failed_at: new Date(),
      });

      const route = payload?.route || "";
      const serviceType = route.split("/")[2]?.toUpperCase() || "NIN";

      logVerification({
        apiKey: process.env.API_KEY,
        serviceType,
        status: "FAILED",
        requestId: payload?.idempotencyKey,
        amountInKobo: NIN_COST_IN_KOBO,
        walletTransactionId: "",
      }).catch((err) => {
        console.error("Failed to log failed verification", {
          requestId: payload?.idempotencyKey,
          error: err.message,
        });
      });

      console.log(`[✓] Dead job ${jobId} marked failed`);
      channel.ack(msg);

      if (payload?.idempotencyKey) {
        await redisClient.set(
          `IDEMPOTENCY:${payload.idempotencyKey}`,
          JSON.stringify({ status: "failed", id: jobId }),
          { EX: 8400 },
        );
      }
    } catch (err) {
      console.error(
        `[DeadConsumer] Failed to process dead job ${jobId}:`,
        err.message,
      );
      channel.nack(msg, false, true);
    }
  });
}

module.exports = { startDeadConsumer };
