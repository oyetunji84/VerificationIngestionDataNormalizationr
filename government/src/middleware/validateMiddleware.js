const Joi = require("joi");

const verificationSchema = Joi.object({
  id: Joi.string().required().messages({
    "any.required": "MISSING REQUIRED FIELD: id",
  }),

  callbackUrl: Joi.string().uri().optional(),
  verificationId: Joi.string().optional(),
});

const validate = (req, res, next) => {
  const { error } = verificationSchema.validate(req.body);
  if (error) {
    return res.status(400).json({
      code: "400",
      message: error.details[0].message,
    });
  }
  next();
};

module.exports = validate;
