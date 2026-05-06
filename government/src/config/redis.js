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
const disconnectRedis = async () => {
  try {
    await redisClient.quit();
    console.log("Disconnected from Redis (Billing Service)");
  } catch (error) {
    console.error("Error disconnecting Redis:", error);
  }
};

module.exports = { redisClient, connectRedis, disconnectRedis };
// module.exports = { redisClient, connectRedis }; --- IGNORE ---
module.exports = { redisClient, connectRedis };
