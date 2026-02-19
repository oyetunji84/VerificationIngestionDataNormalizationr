const crypto = require('crypto');

const generateApiKey = (prefix = 'ak') => {
  const randomBytes = crypto.randomBytes(32);
  
  const hexString = randomBytes.toString('hex');
  
  const apiKey = `${prefix}_${hexString}`;
  
  return apiKey;
};

const validateApiKeyFormat = (apiKey) => {
  if (!apiKey || typeof apiKey !== 'string') return false;
  
  const pattern = /^[a-z]+_[a-f0-9]{64}$/;
  return pattern.test(apiKey);
};


const generateRandomString = (length = 32) => {
  return crypto.randomBytes(length).toString('hex').substring(0, length);
};

const hashValue = (value) => {
  return crypto.createHash('sha256').update(value).digest('hex');
};

module.exports = {
  generateApiKey,
  validateApiKeyFormat,
  generateRandomString,
  hashValue
};