const { createClient } = require("redis");

const redisClient = createClient({
  url: process.env.REDIS_URL,
});

redisClient.on("error", (err) => {
  console.log("REDIS CLIENT EVENT ERROR", err);
});

const connectRedis = async () => {
  try {
    await redisClient.connect();
    console.log("Connected to REdis [BILLING SERVICE]");
  } catch (err) {
    console.error("Redis you fucking giving me error what is the stress", err);
  }
};

module.exports = { redisClient, connectRedis };
