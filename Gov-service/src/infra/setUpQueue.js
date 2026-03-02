const { getChannel } = require("./rabbitmq");

const TOPOLOGY = {
  DEADEXCHANGE: "jobs.dead.gov.exchange",
  JOBEXCHANGE: "jobs.gov.exchange",
  QUEUES: {
    MAIN: "jobs.main.gov",
    RETRY: "jobs.retry.gov",
    DEAD: "jobs.dead.gov",
  },
  ROUTING_KEYS: {
    MAIN: "mainGov",
    RETRY: "retryGov",
    DEAD: "deadGov",
  },
  MAX_RETRIES: 5,
  RETRY_BASE_DELAY_MS: 1000,
};

async function setupQueues() {
  let channel;

  try {
    channel = await getChannel();
  } catch (err) {
    console.warn(
      "Failed to get RabbitMQ channel, retrying in 5 seconds...",
      err.message,
    );
    await new Promise((res) => setTimeout(res, 5000));
    return setupQueues();
  }
  try {
    console.log("Setting up RabbitMQ topology in Gov-service...");

    await channel.assertExchange(TOPOLOGY.JOBEXCHANGE, "direct", {
      durable: true,
    });

    await channel.assertExchange(TOPOLOGY.DEADEXCHANGE, "direct", {
      durable: true,
    });

    await channel.assertQueue(TOPOLOGY.QUEUES.DEAD, {
      durable: true,
    });

    await channel.bindQueue(
      TOPOLOGY.QUEUES.DEAD,
      TOPOLOGY.DEADEXCHANGE,
      TOPOLOGY.ROUTING_KEYS.DEAD,
    );

    await channel.assertQueue(TOPOLOGY.QUEUES.RETRY, {
      durable: true,
      arguments: {
        "x-dead-letter-exchange": TOPOLOGY.JOBEXCHANGE,
        "x-dead-letter-routing-key": TOPOLOGY.ROUTING_KEYS.MAIN,
      },
    });

    await channel.bindQueue(
      TOPOLOGY.QUEUES.RETRY,
      TOPOLOGY.JOBEXCHANGE,
      TOPOLOGY.ROUTING_KEYS.RETRY,
    );

    await channel.assertQueue(TOPOLOGY.QUEUES.MAIN, {
      durable: true,
      arguments: {
        "x-dead-letter-exchange": TOPOLOGY.DEADEXCHANGE,
        "x-dead-letter-routing-key": TOPOLOGY.ROUTING_KEYS.DEAD,
      },
    });

    await channel.bindQueue(
      TOPOLOGY.QUEUES.MAIN,
      TOPOLOGY.JOBEXCHANGE,
      TOPOLOGY.ROUTING_KEYS.MAIN,
    );

    console.log("RabbitMQ topology ready in Gov-service");
  } catch (err) {
    console.error("Failed to setup RabbitMQ topology in Gov-service", err);
    throw err;
  }
}

async function publishWithConfirm(routingKey, content, options = {}) {
  let channel;

  try {
    channel = await getChannel();
  } catch (err) {
    console.warn(
      "Failed to get RabbitMQ channel, retrying in 5 seconds...",
      err.message,
    );
    await new Promise((res) => setTimeout(res, 5000));
    return publishWithConfirm(routingKey, content, options);
  }

  return await new Promise((resolve, reject) => {
    try {
      const bufferHasRoom = channel.publish(
        TOPOLOGY.JOBEXCHANGE,
        routingKey,
        Buffer.from(content),
        {
          persistent: true,
          contentType: "application/json",
          ...options,
        },
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
          "write buffer full — waiting for drain before next publish",
        );
        channel.once("drain", () => {
          console.log("buffer drained — safe to continue publishing");
        });
      }
    } catch (err) {
      console.error("[AMQP] publishWithConfirm error", err);
      reject(err);
    }
  });
}

async function publishToMainQueue(jobId, payload, retryCount) {
  console.log("Publishing to main queue with payload:", payload);
  const message = JSON.stringify({ jobId, payload, retryCount });
  console.log("Publishing to main queue:", message);
  await publishWithConfirm(TOPOLOGY.ROUTING_KEYS.MAIN, message, {
    messageId: jobId,
  });

  console.log(`jobId=${jobId} broker confirmed in main queue`);
}

async function publishToRetryQueue(jobId, payload, retryCount) {
  const backoffMs = TOPOLOGY.RETRY_BASE_DELAY_MS * Math.pow(2, retryCount);
  const message = JSON.stringify({ jobId, payload, retryCount });

  await publishWithConfirm(TOPOLOGY.ROUTING_KEYS.RETRY, message, {
    messageId: `${jobId}-retry-${retryCount}`,
    expiration: String(backoffMs),
  });

  console.log(
    `jobId=${jobId} retry #${retryCount} confirmed (backoff ${backoffMs}ms)`,
  );
}

module.exports = {
  TOPOLOGY,
  setupQueues,
  publishToMainQueue,
  publishToRetryQueue,
};
