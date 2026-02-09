const Joi = require('joi');

const verifyLicenseSchema = Joi.object({
  license_number: Joi.string()
    .min(5)
    .max(15)
    .required()
    .messages({
      'string.min': 'License number must be at least 5 characters',
      'string.max': 'License number cannot exceed 15 characters',
      'any.required': 'License number is required'
    })
});
module.exports= verifyLicenseSchema