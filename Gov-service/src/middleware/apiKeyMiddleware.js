const crypto = require("crypto");

const {
  asyncHandler,
  UnauthorizedError,
  ValidationError,
} = require("../utility/error");
const { checkApiKeyHash } = require("../repository/companyRepository");

const hashApiKey = (apiKey) => {
  return crypto.createHash("sha256").update(apiKey).digest("hex");
};

const apiKeyAuth = asyncHandler(async (req, res, next) => {
  const rawKey =
    req.header("x-api-key") ||
    req.header("X-API-KEY") ||
    req.headers["x-api-key"];

  if (!rawKey) {
    throw new UnauthorizedError("API key missing", {
      path: req.path,
      method: req.method,
    });
  }

  if (rawKey.length < 20) {
    throw new ValidationError("Invalid API key format", {
      path: req.path,
      method: req.method,
    });
  }

  const apiKeyHash = hashApiKey(rawKey);

  const company = await checkApiKeyHash(apiKeyHash);

  if (!company || company.status !== "ACTIVE") {
    throw new UnauthorizedError("Invalid or inactive API key", {
      path: req.path,
      method: req.method,
    });
  }

  req.company = {
    id: company.id,
    name: company.name,
    email: company.email,
    status: company.status,
  };

  next();
});

module.exports = {
  apiKeyAuth,
};
