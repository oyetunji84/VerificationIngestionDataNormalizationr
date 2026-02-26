const Joi = require("joi");

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
  callBackUrl: Joi.string().uri().optional().messages({
    "string.uri": "Call back URL must be a valid URI",
  }),
});

module.exports = verifyBVNSchema;
