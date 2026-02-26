const { getChannel } = require("../infra/raddbitmq");
const { TOPOLOGY } = require("../infra/setUpQueue");
function publishWithConfirm(routingKey, content, options = {}) {
  return new Promise(async (resolve, reject) => {
    const channel = await getChannel();
    console.log();
    const bufferHasRoom = channel.publish(
      TOPOLOGY.JOBEXCHANGE,
      routingKey,
      Buffer.from(content),
      { persistent: true, contentType: "application/json", ...options },
      (err) => {
        if (err) {
          console.error("[AMQP] publish error", err);
          return reject(new Error(`Broker rejected message: ${err.message}`));
        }
        resolve();
      },
    );

    if (!bufferHasRoom) {
      console.log(
        "[AMQP] write buffer full — waiting for drain before next publish",
      );
      channel.once("drain", () => {
        console.log("[AMQP] buffer drained — safe to continue publishing");
      });
      // We still wait for the broker callback above — do NOT reject here
    }
  });
}

async function publishJob(jobId, payload, retryCount = 0) {
  const message = JSON.stringify({ jobId, payload, retryCount });
  console.log(payload);
  await publishWithConfirm(TOPOLOGY.ROUTING_KEYS.MAIN, message, {
    messageId: jobId,
  });

  console.log(`[✓] jobId=${jobId} broker confirmed in main queue`);
}

async function publishRetry(jobId, payload, retryCount) {
  const backoffMs = TOPOLOGY.RETRY_BASE_DELAY_MS * Math.pow(2, retryCount);
  const message = JSON.stringify({ jobId, payload, retryCount });

  await publishWithConfirm(TOPOLOGY.ROUTING_KEYS.RETRY, message, {
    messageId: `${jobId}-retry-${retryCount}`,
    expiration: String(backoffMs), // TTL — after this, message moves back to main queue via DLX
  });

  console.log(
    `[✓] jobId=${jobId} retry #${retryCount} confirmed (backoff ${backoffMs}ms)`,
  );
}

module.exports = { publishJob, publishRetry };
