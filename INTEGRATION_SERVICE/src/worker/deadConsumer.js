require("dotenv").config();

const { getChannel } = require("../infra/raddbitmq");
const { TOPOLOGY } = require("../infra/setUpQueue");
const { logVerification } = require("../service/historyService");
const { redisClient } = require("../infra/redisDb");
const NIN_COST_IN_NAIRA = 100;
const NIN_COST_IN_KOBO = NIN_COST_IN_NAIRA * 100;
const Job = require("../models/JobModel");
async function refundUser(job) {
  // await walletService.credit({
  //   companyId: job.companyId,
  //   amountInKobo: job.amountInKobo,
  //   description: `Refund for failed job ${job._id}`,
  //   idempotencyKey: `refund-${job._id}`,
  // });
  console.log(
    `[DeadConsumer] Refund issued for job ${job._id} — amount: ${job.amountInKobo}`,
  );
}

async function startDeadConsumer() {
  const channel = await getChannel();

  channel.prefetch(10);

  console.log("[DeadConsumer] Listening for dead-lettered jobs...");

  channel.consume(TOPOLOGY.QUEUES.DEAD, async (msg) => {
    if (!msg) return;

    let jobId, payload, retryCount;
    try {
      ({ jobId, payload, retryCount, _, route } = JSON.parse(
        msg.content.toString(),
      ));
    } catch (e) {
      console.error(" Failed to parse dead message:");
      channel.ack(msg);
      return;
    }
    console.log(payload);
    console.warn(` Processing dead job ${jobId} after ${retryCount} retries`);

    try {
      await Job.findByIdAndUpdate(jobId, {
        status: "failed",
        retry_count: retryCount,
        failed_at: new Date(),
      });

      //   await refundUser(job);
      console.log(route);
      logVerification({
        apiKey: process.env.API_KEY,
        serviceType: payload.route.split("/")[2].toUpperCase(), // crude way to get service type from route
        status: "FAILED",
        idempotencyKey: payload.idempotencyKey,
        amountInKobo: NIN_COST_IN_KOBO,
        walletTransactionId: "",
      }).catch((err) => {
        console.error("Failed to log NIN verification", {
          idempotencyKey,
          error: err.message,
        });
      });

      console.log(`[✓] Dead job ${jobId} marked failed + refunded`);
      channel.ack(msg);
      //set the cache here for the idempotency key to avoid hitting the flow again
      if (payload.idempotencyKey) {
        await redisClient.set(
          `IDEMPOTENCY:${payload.idempotencyKey}`,
          JSON.stringify({ status: "failed", id: jobId }),
          {
            EX: 8400,
          },
        );
      }
    } catch (err) {
      console.error(
        err,
        `[DeadConsumer] Failed to process dead job ${jobId}:`,
        err.message,
      );
      channel.nack(msg, false, true);
    }
  });
}

module.exports = { startDeadConsumer };
