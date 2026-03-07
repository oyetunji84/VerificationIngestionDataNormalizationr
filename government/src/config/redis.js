const { createClient } = require("redis");

const redisClient = createClient({
  url: process.env.REDIS_URL,
});

redisClient.on("error", (err) => console.error("Redis Client Error", err));

const connectRedis = async () => {
  try {
    await redisClient.connect();
    console.log("Connected to Redis (Billing Service)");
  } catch (error) {
    console.error("Redis connection error:", error);
  }
};

module.exports = { redisClient, connectRedis };
