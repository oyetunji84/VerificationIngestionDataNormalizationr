const { getChannel } = require("./raddbitmq");
const TOPOLOGY = {
  DEADEXCHANGE: "jobs.dead.Government.exchange",
  JOBEXCHANGE: "jobs.Government.exchange",
  QUEUES: {
    MAIN: "jobs.Government.main",
    RETRY: "jobs.Government.retry",
    DEAD: "jobs.Government.dead",
  },
  ROUTING_KEYS: {
    MAIN: "mainGovernment",
    RETRY: "retryGovernment",
    DEAD: "deadGovernment",
  },
  MAX_RETRIES: 5,
  RETRY_BASE_DELAY_MS: 1000,
};

async function setupQueues() {
  const channel = await getChannel();
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

  console.log("RabbitMQ topology ready");
}

const publishToQueue = (data) => {
  if (!channel) {
    console.error("RabbitMQ channel is not available.");
    return;
  }
  console.log("[DEBUG] Publishing to exchange...");
  const result = channel.publish(
    TOPOLOGY.JOBEXCHANGE,
    TOPOLOGY.ROUTING_KEYS.MAIN,
    Buffer.from(JSON.stringify(data)),
    { persistent: true },
  );
  console.log(`[DEBUG] Published to exchange. Result: ${result}`);
};

const publishToRetryQueue = (data, delayMs) => {
  if (!channel) {
    console.error("RabbitMQ channel is not available.");
    return;
  }
  channel.publish(
    TOPOLOGY.JOBEXCHANGE,
    TOPOLOGY.ROUTING_KEYS.RETRY,
    Buffer.from(JSON.stringify(data)),
    { persistent: true, expiration: delayMs.toString() },
  );
};

module.exports = { TOPOLOGY, setupQueues, publishToQueue, publishToRetryQueue };
