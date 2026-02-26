const { getChannel } = require("../infra/raddbitmq");
const { TOPOLOGY } = require("../infra/setUpQueue");
const { publishRetry } = require("./publisher");
const Job = require("../models/JobModel");
const HttpClient = require("../../utility/httpClient");
const { AppError } = require("../../utility/error");

const externalClient = new HttpClient(process.env.EXTERNAL_API_URL, {
  retries: 0,
  providerName: "ExternalJobAPI",
});

async function processJob(payload, idempotencyKey, url) {
  const result = await externalClient.post(url, payload, {
    idempotencyKey,
  });
  return result;
}

async function startConsumer() {
  const channel = await getChannel();
  channel.prefetch(20);
  // console.log(channel);
  console.log("[Consumer] waiting for jobs...");

  channel.consume(TOPOLOGY.QUEUES.MAIN, async (msg) => {
    if (!msg) return;

    let jobId, payload, retryCount, idempotencyKey, route;

    try {
      ({ jobId, payload, retryCount, idempotencyKey, route } = JSON.parse(
        msg.content.toString(),
      ));
    } catch (e) {
      console.log("[Consumer] failed to parse message — dead lettering");
      channel.nack(msg, false, false);
      return;
    }

    const job = await Job.findById(jobId);
    if (!job) {
      console.log(`[Consumer] job ${jobId} not found — discarding`);
      channel.ack(msg);
      return;
    }

    if (job.status === "success") {
      console.log(
        `[Consumer] job ${jobId} already succeeded — discarding duplicate`,
      );
      channel.ack(msg);
      return;
    }

    await Job.findByIdAndUpdate(jobId, {
      status: "processing",
      retry_count: retryCount,
    });

    try {
      const result = await processJob(
        payload,
        retryCount,
        idempotencyKey,
        route,
      );

      await Job.findByIdAndUpdate(jobId, {
        status: "success",
        result,
      });

      console.log(`[✓] job ${jobId} succeeded`);
      channel.ack(msg);
      // also set the log verification that it succeds
      // set the nin, bvn, license, and passport  cache here for successful
    } catch (error) {
      const retryable = !(error instanceof AppError) || error.retryable;
      const exhausted = retryCount >= TOPOLOGY.MAX_RETRIES;

      console.error(
        `[Consumer] job ${jobId} failed (retry ${retryCount}/${TOPOLOGY.MAX_RETRIES}):`,
        error.message,
      );

      if (!retryable || exhausted) {
        channel.nack(msg, false, false);
      } else {
        await publishRetry(jobId, payload, retryCount + 1, idempotencyKey);
        channel.ack(msg);
      }
    }
  });
}

module.exports = { startConsumer };
