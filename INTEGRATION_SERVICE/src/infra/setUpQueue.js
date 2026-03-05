const { getChannel } = require("./rabbitmq");

const TOPOLOGY = {
  MAX_RETRIES: 5,
  RETRY_BASE_DELAY_MS: 1000,

  JOB: {
    DEADEXCHANGE: "jobs.dead.exchange",
    EXCHANGE: "jobs.exchange",
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
  },

  VERIFICATION_INDEX: {
    DEADEXCHANGE: "verification.index.dead.exchange",
    EXCHANGE: "verification.index.exchange",
    QUEUES: {
      MAIN: "verification.index.main",
      RETRY: "verification.index.retry",
      DEAD: "verification.index.dead",
    },
    ROUTING_KEYS: {
      MAIN: "verificationIndexMain",
      RETRY: "verificationIndexRetry",
      DEAD: "verificationIndexDead",
    },
  },
};

async function assertDomainTopology(channel, domain) {
  await channel.assertExchange(domain.EXCHANGE, "direct", {
    durable: true,
  });
  await channel.assertExchange(domain.DEADEXCHANGE, "direct", {
    durable: true,
  });

  await channel.assertQueue(domain.QUEUES.DEAD, {
    durable: true,
  });
  await channel.bindQueue(
    domain.QUEUES.DEAD,
    domain.DEADEXCHANGE,
    domain.ROUTING_KEYS.DEAD,
  );

  await channel.assertQueue(domain.QUEUES.RETRY, {
    durable: true,
    arguments: {
      "x-dead-letter-exchange": domain.EXCHANGE,
      "x-dead-letter-routing-key": domain.ROUTING_KEYS.MAIN,
    },
  });
  await channel.bindQueue(
    domain.QUEUES.RETRY,
    domain.EXCHANGE,
    domain.ROUTING_KEYS.RETRY,
  );

  await channel.assertQueue(domain.QUEUES.MAIN, {
    durable: true,
    arguments: {
      "x-dead-letter-exchange": domain.DEADEXCHANGE,
      "x-dead-letter-routing-key": domain.ROUTING_KEYS.DEAD,
    },
  });
  await channel.bindQueue(
    domain.QUEUES.MAIN,
    domain.EXCHANGE,
    domain.ROUTING_KEYS.MAIN,
  );
}

async function setupQueues() {
  const channel = await getChannel();

  await assertDomainTopology(channel, TOPOLOGY.JOB);
  await assertDomainTopology(channel, TOPOLOGY.VERIFICATION_INDEX);

  console.log("RabbitMQ topology ready");
}

module.exports = { TOPOLOGY, setupQueues };
