const { getChannel } = require("../infra/rabbitmq");
const { TOPOLOGY, publishToRetryQueue } = require("../infra/setUpQueue");
const {
  findJobById,
  findJobByIdAndUpdate,
} = require("../repository/jobRepository");
const axios = require("axios");
const { AppError } = require("../utility/error.js");
const {
  verifyBvn,
  verifyLicense,
  verifyPassport,
  verifyNin,
} = require("../services/index.js");

// const processJOB =  axios post works here
async function startConsumer() {
  const channel = await getChannel();
  if (!channel) {
    console.error("RabbitMQ channel not available. Worker cannot start.");
    setTimeout(startConsumer, 5000);

    return;
  }
  channel.prefetch(20);

  console.log("[Consumer] waiting for jobs...");

  channel.consume(TOPOLOGY.QUEUES.MAIN, async (msg) => {
    if (!msg) return;
    console.log("data sent from the queue here");

    let dbId,
      id,
      callbackUrl,
      companyId,
      digit,
      type,
      IdempotencyKey,
      retryCount;

    try {
      ({
        dbId,
        id,
        callbackUrl,
        companyId,
        digit,
        type,
        IdempotencyKey,
        retryCount,
      } = JSON.parse(msg.content.toString()));
    } catch (e) {
      console.log("[Consumer] failed to parse message — dead lettering");
      channel.nack(msg, false, false);
      return;
    }

    const job = await findJobById(id);
    if (!job) {
      console.log(`[Consumer] job ${id} not found — discarding`);
      channel.ack(msg);
      return;
    }

    if (job.status === "success") {
      console.log(
        `[Consumer] job ${id} already succeeded — discarding duplicate`,
      );
      channel.ack(msg);
      return;
    }

    let result;
    try {
      try {
        // (bvnNumber, companyId, requestId);
        switch (type) {
          case "BVN":
            result = await verifyBvn(digit, companyId, IdempotencyKey);
          case "NIN":
            result = await verifyNin(digit, companyId, IdempotencyKey);
          case "LICENSE":
            result = await verifyLicense(digit, companyId, IdempotencyKey);
          case "PASSPORT":
            result = await verifyPassport(digit, companyId, IdempotencyKey);
          default:
            console.log("error");
        }
      } catch (error) {
        // if the error is an AppError  there is a high probability its a notfounderror we update the Job status to failed and send a post request to the callback url with the error message
        // console.log(`error in switch case`, error);
        // throw error;
      }
      await findJobByIdAndUpdate(dbId, "processing", retryCount);
      if (callbackUrl) {
        try {
          await axios.post(callbackUrl, {
            ...(id && { id }),
            ...(result && { result }),
          });
        } catch (error) {
          console.log(` error sending reques`, error);
        }
        console.log(`[✓] job ${DbId} succeeded`);
        await findJobByIdAndUpdate(dbId, "success", retryCount);
        console.log(`[✓] job ${DbId} succeeded`);
        channel.ack(msg);
      }
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
        const payload = {
          dbId,
          id,
          callbackUrl,
          companyId,
          digit,
          type,
          IdempotencyKey,
        };
        await publishToRetryQueue(jobId, payload, retryCount + 1);
        channel.ack(msg);
      }
    }
  });
}

module.exports = { startConsumer };
