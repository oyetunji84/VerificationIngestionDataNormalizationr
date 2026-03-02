const {
  CreateCompany,
  findCompanyByNameAndEmail,
} = require("../repository/companyRepository");
const { ValidationError } = require("../utility/error");

const crypto = require("crypto");
const hashApiKey = (apiKey) => {
  return crypto.createHash("sha256").update(apiKey).digest("hex");
};

const generateApiKey = () => {
  return crypto.randomBytes(32).toString("hex");
};

const createCompanyService = async ({ name, email }) => {
  try {
    console.log(name, email, "IN COMPANY SERVICE");
    const existing = await findCompanyByNameAndEmail(name, email);
    console.log(existing, "IN COMPANY SERVICE");
    if (existing) {
      throw new ValidationError(
        "Company with this name and email already exists",
        {
          name,
          email,
        },
      );
    }

    const companyId = crypto.randomUUID();

    const apiKey = generateApiKey();
    const apiKeyHash = hashApiKey(apiKey);

    const company = await CreateCompany(companyId, name, email, apiKeyHash);

    if (!company) {
      throw new Error("Failed to create company");
    }

    return {
      company,
      apiKey,
    };
  } catch (err) {
    console.log("Error creating company:", err);
    throw err;
  }
};

module.exports = {
  createCompanyService,
};
