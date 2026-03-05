const Company = require("../models/companyModel");

async function findByEmail(companyEmail) {
  return Company.findOne({ companyEmail });
}

async function findActiveByApiKey(apiKey) {
  return Company.findOne({ apiKey, status: "active" });
}

async function findByApiKey(apiKey) {
  return Company.findOne({ apiKey }).select("-__v");
}

async function createCompany({ companyName, companyEmail, apiKey, status }) {
  const company = new Company({
    companyName,
    companyEmail,
    apiKey,
    status,
  });

  return company.save();
}

module.exports = {
  findByEmail,
  findActiveByApiKey,
  findByApiKey,
  createCompany,
};
