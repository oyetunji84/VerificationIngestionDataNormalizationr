const { createClient } = require("redis");

const redisClient = createClient({
  url: process.env.REDIS_URL || "redis://localhost:6379",
});

redisClient.on("error", (err) =>
  console.error("Gateway Redis Client Error", err),
);

const connectRedis = async () => {
  try {
    await redisClient.connect();
    console.log("Connected to Redis (Gateway Billing)");
  } catch (error) {
    console.error("Gateway Redis connection error:", error);
  }
};

module.exports = { redisClient, connectRedis };
