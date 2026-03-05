const internalApiKeyAuth = (req, res, next) => {
  const configuredKey = process.env.INTERNAL_API_KEY;
  const providedKey = req.headers["x-internal-api-key"];

  if (!configuredKey) {
    return res.status(503).json({
      success: false,
      error: {
        code: "INTERNAL_AUTH_NOT_CONFIGURED",
        message: "Internal API key is not configured",
      },
    });
  }

  if (!providedKey || providedKey !== configuredKey) {
    return res.status(401).json({
      success: false,
      error: {
        code: "INVALID_INTERNAL_API_KEY",
        message: "Invalid internal API key",
      },
    });
  }

  return next();
};

module.exports = { internalApiKeyAuth };
