const { asyncHandler } = require("../utility/error");
const { createCompanyService } = require("../services/companyService");

const createCompanyController = asyncHandler(async (req, res, next) => {
  const { name, email } = req.validatedData;

  const { company, apiKey } = await createCompanyService({ name, email });

  return res.status(201).json({
    success: true,
    data: {
      company,
      apiKey,
    },
  });
});

module.exports = { createCompanyController };
