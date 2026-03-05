const { generateApiKey } = require("../../utility/apiKeyGenerator");
const companyRepository = require("../repository/companyRepository");

const registerCompany = async (companyData) => {
  try {
    const { companyName, companyEmail } = companyData;

    const existingCompany = await companyRepository.findByEmail(companyEmail);
    if (existingCompany) {
      throw new Error("Company with this email already exists");
    }

    const apiKey = generateApiKey();
    const savedCompany = await companyRepository.createCompany({
      companyName,
      companyEmail,
      apiKey,
      status: "active",
    });

    console.log("Company registered successfully", {
      companyId: savedCompany._id,
      companyEmail: savedCompany.companyEmail,
    });

    return {
      _id: savedCompany._id,
      companyName: savedCompany.companyName,
      companyEmail: savedCompany.companyEmail,
      apiKey: savedCompany.apiKey,
      status: savedCompany.status,
      createdAt: savedCompany.createdAt,
    };
  } catch (error) {
    console.log("Error registering company", { error: error.message });
    throw error;
  }
};

const validateApiKey = async (apiKey) => {
  try {
    if (!apiKey) return null;

    const company = await companyRepository.findActiveByApiKey(apiKey);
    if (!company) {
      console.log("Invalid or revoked API key", {
        apiKey: apiKey.substring(0, 10) + "...",
      });
      return null;
    }

    console.log("API key validated", {
      companyId: company._id,
      companyName: company.companyName,
    });

    return company;
  } catch (error) {
    console.log("Error validating API key", { error: error.message });
    return null;
  }
};

const getCompanyByApiKey = async (apiKey) => {
  try {
    const company = await companyRepository.findByApiKey(apiKey);
    if (!company) {
      console.log("Company not found for API key");
      return null;
    }
    return company;
  } catch (error) {
    console.log("Error fetching company", { error: error.message });
    return null;
  }
};

module.exports = {
  registerCompany,
  validateApiKey,
  getCompanyByApiKey,
};
