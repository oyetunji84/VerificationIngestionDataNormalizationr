const Redis = require("ioredis");
const env = require("./env");
const logger = require("../utils/logger");

const redisClient = new Redis({
  host: env.redis.host,
  port: Number(env.redis.port),
  password: env.redis.password || undefined,
  lazyConnect: true,
  retryStrategy: (times) => {
    const delay = Math.min(times * 500, 30000);
    logger.warn(`Redis retry attempt ${times}, next in ${delay}ms`);
    return delay;
  },
});

redisClient.on("connect", () => logger.info("Redis connected"));
redisClient.on("error", (err) =>
  logger.error("Redis error", { err: err.message }),
);

const connectRedis = async () => {
  try {
    await redisClient.connect();
  } catch (err) {
    logger.error(err, "from the connect redis function");
  }
};

module.exports = { redisClient, connectRedis };
