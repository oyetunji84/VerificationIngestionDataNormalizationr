const Joi = require("joi");

const verifyPassportSchema = Joi.object({
  passport_number: Joi.string().min(7).max(10).alphanum().required().messages({
    "string.min": "Passport number must be at least 7 characters",
    "string.max": "Passport number cannot exceed 10 characters",
    "string.alphanum": "Passport number must be alphanumeric",
    "any.required": "Passport number is required",
  }),
});
module.exports = verifyPassportSchema;
