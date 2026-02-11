const Joi = require("joi");

const fundWalletSchema = Joi.object({
  amountInNaira: Joi.number()
    .precision(2)
    .greater(0)
    .required()
    .messages({
      "number.base": "amountInNaira must be a number",
      "number.precision": "amountInNaira can have at most 2 decimal places",
      "number.greater": "amountInNaira must be greater than 0",
      "any.required": "amountInNaira is required",
    }),
});

const walletHistoryQuerySchema = Joi.object({
  limit: Joi.number()
    .integer()
    .min(1)
    .max(100)
    .default(20),
  offset: Joi.number()
    .integer()
    .min(0)
    .default(0),
});

module.exports = {
  fundWalletSchema,
  walletHistoryQuerySchema,
};

