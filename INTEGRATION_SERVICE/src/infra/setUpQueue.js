const { getChannel } = require("./raddbitmq");
const TOPOLOGY = {
  DEADEXCHANGE: "jobs.dead.exchange",
  JOBEXCHANGE: "jobs.exchange",
  QUEUES: {
    MAIN: "jobs.main",
    RETRY: "jobs.retry",
    DEAD: "jobs.dead",
  },
  ROUTING_KEYS: {
    MAIN: "main",
    RETRY: "retry",
    DEAD: "dead",
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

module.exports = { TOPOLOGY, setupQueues };
