const validateSchema = (schema, source = "body") => {
  return (req, res, next) => {
    const payload = source === "query" ? req.query : req.body;
    const { error } = schema.validate(payload);
    if (error) {
      return res.status(400).json({
        code: "400",
        message: error.details[0].message,
      });
    }
    next();
  };
};

module.exports = { validateSchema };
