const { desc } = require("drizzle-orm");
const Joi = require("joi");

const fundWalletSchema = Joi.object({
  description: Joi.string().max(255).optional().messages({
    "string.max": "Description cannot exceed 255 characters",
  }),
  amountInNaira: Joi.number().precision(2).greater(0).required().messages({
    "number.base": "amountInNaira must be a number",
    "number.precision": "amountInNaira can have at most 2 decimal places",
    "number.greater": "amountInNaira must be greater than 0",
    "any.required": "amountInNaira is required",
  }),
});

const walletHistoryQuerySchema = Joi.object({
  limit: Joi.number().integer().min(1).max(100).default(20),
  offset: Joi.number().integer().min(0).default(0),
});

const verifyNINSchema = Joi.object({
  nin: Joi.string()
    .length(11)
    .pattern(/^[0-9]{11}$/)
    .required()
    .messages({
      "string.length": "NIN must be exactly 11 digits",
      "string.pattern.base": "NIN must contain only numbers",
      "any.required": "NIN is required",
    }),
});

const verifyBVNSchema = Joi.object({
  bvn: Joi.string()
    .length(11)
    .pattern(/^[0-9]{11}$/)
    .required()
    .messages({
      "string.length": "BVN must be exactly 11 digits",
      "string.pattern.base": "BVN must contain only numbers",
      "any.required": "BVN is required",
    }),
});
const verifyLicenseSchema = Joi.object({
  licenseNumber: Joi.string().min(5).max(15).required().messages({
    "string.min": "License number must be at least 5 characters",
    "string.max": "License number cannot exceed 15 characters",
    "any.required": "License number is required",
  }),
});

const verifyPassportSchema = Joi.object({
  passportNumber: Joi.string().min(7).max(10).alphanum().required().messages({
    "string.min": "Passport number must be at least 7 characters",
    "string.max": "Passport number cannot exceed 10 characters",
    "string.alphanum": "Passport number must be alphanumeric",
    "any.required": "Passport number is required",
  }),
});

const historyFiltersSchema = Joi.object({
  serviceType: Joi.string()
    .valid("NIN", "BVN", "DRIVERS_LICENSE", "PASSPORT")
    .optional(),
  startDate: Joi.date().optional(),
  endDate: Joi.date().min(Joi.ref("startDate")).optional(),
  status: Joi.string().valid("SUCCESS", "FAILED", "PARTIAL").optional(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
});

const registerCompanySchema = Joi.object({
  companyName: Joi.string().min(2).max(200).required().messages({
    "string.min": "Company name must be at least 2 characters",
    "string.max": "Company name cannot exceed 200 characters",
    "any.required": "Company name is required",
  }),

  companyEmail: Joi.string().email().required().messages({
    "string.email": "Invalid email format",
    "any.required": "Company email is required",
  }),
});

module.exports = {
  registerCompanySchema,
  verifyNINSchema,
  verifyBVNSchema,
  verifyLicenseSchema,
  fundWalletSchema,
  walletHistoryQuerySchema,
  verifyPassportSchema,
  historyFiltersSchema,
};
