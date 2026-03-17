const Joi = require("joi");

const fundSchema = Joi.object({
  amount: Joi.number().positive().required().messages({
    "any.required": "MISSING REQUIRED FIELD: amount",
    "number.base": "amount must be a number",
    "number.positive": "amount must be greater than zero",
  }),
  reference: Joi.string().optional().messages({
    "string.base": "reference must be a string",
  }),
});

const historySchema = Joi.object({
  page: Joi.number().integer().min(1).optional().messages({
    "number.base": "page must be a number",
    "number.integer": "page must be an integer",
    "number.min": "page must be at least 1",
  }),
  limit: Joi.number().integer().min(1).max(100).optional().messages({
    "number.base": "limit must be a number",
    "number.integer": "limit must be an integer",
    "number.min": "limit must be at least 1",
    "number.max": "limit must be at most 100",
  }),
});

module.exports = {
  fundSchema,
  historySchema,
};
