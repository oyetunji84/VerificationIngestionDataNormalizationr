const Joi = require("joi");

const fundSchema = Joi.object({
  amount: Joi.number().positive().required().messages({
    "any.required": "Amount is required",
    "number.base": "Amount must be a number",
    "number.positive": "Amount must be greater than zero",
  }),
});

module.exports = {
  fundSchema,
};
