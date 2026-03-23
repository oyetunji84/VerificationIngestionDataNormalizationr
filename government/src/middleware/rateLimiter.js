const { redisClient } = require("../config/redis");

const fs = require("fs");
const path = require("path");

const luaScript = fs.readFileSync(
  path.join(__dirname, "../config/leakyBucket.lua"),
  "utf8",
);

const CAPACITY = 200;
const LEAK_RATE = 200 / 60;

async function leakyBucketMiddleware(req, res, next) {
  const clientKey = req.headers["x-api-key"];
  if (!apiKey) {
    return res.status(401).json({ error: "Missing API key" });
  }
  const now = Date.now() / 1000;

  try {
    const [allowed, currentQueue] = await redisClient.eval(
      luaScript,
      1,
      clientKey,
      CAPACITY,
      LEAK_RATE,
      now,
    );

    res.setHeader("X-RateLimit-Limit", CAPACITY);
    res.setHeader("X-RateLimit-Remaining", CAPACITY - currentQueue);

    if (allowed === 1) {
      return next();
    }

    res.setHeader("Retry-After", Math.ceil(1 / LEAK_RATE));
    return res.status(429).json({
      error: "Too Many Requests",
      retryAfter: Math.ceil(1 / LEAK_RATE),
    });
  } catch (err) {
    console.error("Rate limiter error:", err);
    return next();
  }
}

module.exports = leakyBucketMiddleware;
