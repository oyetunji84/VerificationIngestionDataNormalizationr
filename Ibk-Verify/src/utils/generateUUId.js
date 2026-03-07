const crypto = require("crypto");

function generateuniqueKey() {
  return crypto.randomUUID();
}
module.exports = generateuniqueKey;
