const Joi = require("joi");
const createCompanySchema = Joi.object({
  name: Joi.string().min(2).max(255).required(),
  email: Joi.string().email().max(255).required(),
});
const verifyBVNSchema = Joi.object({
  id: Joi.string()
    .required()
    .messages({ "any.required": "id is required" }),
  callbackUrl: Joi.string()
    .uri()
    .required()
    .messages({
      "string.uri": "callbackUrl must be a valid URI",
      "any.required": "callbackUrl is required",
    }),
  bvn: Joi.string()
    .length(11)
    .pattern(/^[0-9]{11}$/)
    .required()
    .messages({
      "string.length": "bvn must be exactly 11 digits",
      "string.pattern.base": "bvn must contain only numbers",
      "any.required": "bvn is required",
    }),
});

const verifyNINSchema = Joi.object({
  id: Joi.string()
    .required()
    .messages({ "any.required": "id is required" }),
  callbackUrl: Joi.string()
    .uri()
    .required()
    .messages({
      "string.uri": "callbackUrl must be a valid URI",
      "any.required": "callbackUrl is required",
    }),
  nin: Joi.string()
    .length(11)
    .pattern(/^[0-9]{11}$/)
    .required()
    .messages({
      "string.length": "nin must be exactly 11 digits",
      "string.pattern.base": "nin must contain only numbers",
      "any.required": "nin is required",
    }),
});

const verifyLicenseSchema = Joi.object({
  id: Joi.string()
    .required()
    .messages({ "any.required": "id is required" }),
  callbackUrl: Joi.string()
    .uri()
    .required()
    .messages({
      "string.uri": "callbackUrl must be a valid URI",
      "any.required": "callbackUrl is required",
    }),
  license_number: Joi.string().min(5).max(15).required().messages({
    "string.min": "License number must be at least 5 characters",
    "string.max": "License number cannot exceed 15 characters",
    "any.required": "License number is required",
  }),
});

const verifyPassportSchema = Joi.object({
  id: Joi.string()
    .required()
    .messages({ "any.required": "id is required" }),
  callbackUrl: Joi.string()
    .uri()
    .required()
    .messages({
      "string.uri": "callbackUrl must be a valid URI",
      "any.required": "callbackUrl is required",
    }),
  passport_number: Joi.string().min(7).max(10).alphanum().required().messages({
    "string.min": "Passport number must be at least 7 characters",
    "string.max": "Passport number cannot exceed 10 characters",
    "string.alphanum": "Passport number must be alphanumeric",
    "any.required": "Passport number is required",
  }),
});

const fundWalletSchema = Joi.object({
  amountInNaira: Joi.number().positive().precision(2).required().messages({
    "number.base": "amountInNaira must be a number",
    "number.positive": "amountInNaira must be greater than 0",
    "any.required": "amountInNaira is required",
  }),
});

module.exports = {
  verifyBVNSchema,
  verifyNINSchema,
  verifyLicenseSchema,
  verifyPassportSchema,
  createCompanySchema,
  fundWalletSchema,
};
