const { RateLimitExceededError } = require("../Utility/error");
const redisClient = require("../infra/redisDb").redisClient;
const { consume, getState } = require("./rateLimitHelper");
const { asyncHandler } = require("../Utility/error");
const rateLimitConfig = require("../Utility/rateLimits");

function normalizeEndpoint(path) {
  return path
    .replace(/^\/api\//, "")
    .replace(/^\/|\/$/g, "")
    .replace(/\//g, "-")
    .toLowerCase();
}

const getEndpointConfig = (endpoint) => {
  return rateLimitConfig.endpoints[endpoint] || rateLimitConfig.default;
};

const createMiddleware = () => {
  return asyncHandler(async (req, res, next) => {
    const apiKey =
      req.header("x-api-key") ||
      req.header("X-API-KEY") ||
      req.headers["x-api-key"];
    const endpoint = normalizeEndpoint(req.path);

    const config = getEndpointConfig(endpoint);

    try {
      const result = await consume(
        apiKey,
        endpoint,
        config.capacity,
        config.leakRate,
      );

      res.setHeader("X-RateLimit-Limit", result.limit);
      res.setHeader("X-RateLimit-Remaining", result.remaining);
      res.setHeader("X-RateLimit-Reset", Math.ceil(result.retryAfter));

      if (result.error) {
        res.setHeader("X-RateLimit-Status", "degraded");
        console.log(
          `Rate limiting degraded for ${endpoint} - Redis unavailable`,
        );
        return next();
      }

      if (!result.allowed) {
        res.setHeader("X-RateLimit-Status", "exceeded");
        res.setHeader("Retry-After", result.retryAfter);
        return next(
          new RateLimitExceededError(
            `You have exceeded the rate limit of ${result.limit} requests per minute for this endpoint. Please try again after ${Math.ceil(result.retryAfter)} seconds.`,
          ),
        );
      }
      next();
    } catch (error) {
      console.error("Rate limit middleware error:", error);
      res.setHeader("X-RateLimit-Status", "error");
      next();
    }
  });
};

async function getRateLimitInfo(redis, apiKey, endpoint) {
  const normalizedEndpoint = normalizeEndpoint(endpoint);
  const config = getEndpointConfig(normalizedEndpoint);
  const state = await getState(
    apiKey,
    normalizedEndpoint,
    config.capacity,
    config.leakRate,
  );

  return {
    endpoint: normalizedEndpoint,
    config,
    currentState: state,
  };
}

module.exports = {
  createMiddleware,
  getRateLimitInfo,
};
