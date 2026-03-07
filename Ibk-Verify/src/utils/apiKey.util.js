const crypto = require("crypto");

const hashApiKey = (apiKey, pepper) => {
  return crypto.createHash("sha256").update(`${apiKey}${pepper}`).digest("hex");
};

const generateApiKey = () => {
  return `ibk_${crypto.randomBytes(32).toString("hex")}`;
};

module.exports = { hashApiKey, generateApiKey };
