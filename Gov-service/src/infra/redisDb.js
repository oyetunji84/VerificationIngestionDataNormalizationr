const { createClient } = require("redis");

const redisClient = createClient({
  url: process.env.REDIS_URL,
});

redisClient.on("error", (err) => {
  console.error("[GOV-SERVICE] Redis client error", err);
});

const connectRedis = async () => {
  try {
    await redisClient.connect();
    console.log("[GOV-SERVICE] Connected to Redis");
  } catch (err) {
    console.error("[GOV-SERVICE] Redis connection error", err);
  }
};

module.exports = { redisClient, connectRedis };

