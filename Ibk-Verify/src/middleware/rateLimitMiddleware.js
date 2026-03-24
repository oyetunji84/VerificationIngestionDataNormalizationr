const { redisClient } = require("../config/redis");

const fs = require("fs");
const path = require("path");

const luaScript = fs.readFileSync(
  path.join(__dirname, "../config/slidingWindow.lua"),
  "utf8",
);
const LIMIT = 200;
const WINDOW_SIZE = 60;

async function slidingWindowMiddleware(req, res, next) {
  const clientKey = req.headers["x-api-key"];
  if (!apiKey) {
    return res.status(401).json({ error: "Missing API key" });
  }

  try {
    const now = Date.now() / 1000;

    const [allowed, currentCount] = await redisClient.eval(
      luaScript,
      1,
      clientKey,
      now,
      WINDOW_SIZE,
      LIMIT,
    );

    res.setHeader("X-RateLimit-Limit", LIMIT);
    res.setHeader("X-RateLimit-Remaining", LIMIT - currentCount);

    if (allowed === 1) {
      return next();
    }
    return res.status(429).json({
      error: "Too Many Requests",
      retryAfter: 60,
    });
  } catch (err) {
    console.error("Rate limiter error:", err);
    return next();
  }
}

module.exports = slidingWindowMiddleware;
