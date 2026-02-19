const fs = require("fs");
const path = require("path");
const { redisClient } = require("../infra/redisDb");

const LUA_SCRIPT = fs.readFileSync(
  path.join(__dirname, "../infra/rateLimit.lua"),
  "utf8",
);
let scriptSha = null;

// Load the script once on startup
const loadScript = async () => {
  scriptSha = await redisClient.scriptLoad(LUA_SCRIPT);
  console.log("Lua script loaded with SHA:", scriptSha);
};

const consume = async (apiKey, endpoint, capacity, leakRate) => {
  const key = `rate:${apiKey}:${endpoint}`;
  const now = Date.now() / 1000;
  const tokens = 1;
  let result;
  try {
    if (scriptSha) {
      result = await redisClient.evalSha(scriptSha, {
        keys: [key],
        arguments: [
          String(capacity),
          String(leakRate),
          String(now),
          String(tokens),
        ],
      });
    } else {
      result = await redisClient.eval(LUA_SCRIPT, {
        keys: [key],
        arguments: [
          String(capacity),
          String(leakRate),
          String(now),
          String(tokens),
        ],
      });
    }

    const allowed = result[0] === 1;
    const remaining = result[1];
    const retryAfter = result[2] || 0;

    return {
      allowed,
      remaining,
      retryAfter,
      limit: capacity,
    };
  } catch (error) {
    console.error("Rate limit check failed:", error);
    return {
      allowed: true,
      remaining: capacity,
      retryAfter: 0,
      limit: capacity,
      error: true,
    };
  }
};
const getState = async (apiKey, endpoint, capacity, leakRate) => {
  const key = `rate:${apiKey}:${endpoint}`;
  try {
    const bucket = await redisClient.hmGet(key, ["tokens", "last_refill"]);
    const tokens = bucket[0] ? parseFloat(bucket[0]) : capacity;
    const lastRefill = bucket[1] ? parseFloat(bucket[1]) : Date.now() / 1000;
    return {
      tokens: Math.floor(tokens),
      lastRefill,
      capacity: capacity,
      leakRate: leakRate,
    };
  } catch (error) {
    console.error("Failed to get bucket state:", error);
    return null;
  }
};
module.exports = { consume, getState, loadScript };
