const Joi = require("joi");

const verifySchema = Joi.object({
  type: Joi.string()
    .valid("NIN", "BVN", "PASSPORT", "DRIVERS_LICENSE")
    .required()
    .messages({
      "any.required": "Verification type is required",
      "any.only": "Type must be one of NIN, BVN, PASSPORT, DRIVERS_LICENSE",
    }),
  id: Joi.string().required().messages({
    "any.required": "ID Number is required",
  }),
});

module.exports = {
  verifySchema,
};
