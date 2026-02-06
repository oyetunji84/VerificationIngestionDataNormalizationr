const validate = (schema, source = 'body') => {
  return (req, res, next) => {
    const dataToValidate = req[source];
    
    const { error, value } = schema.validate(dataToValidate, {
      abortEarly: false,
      stripUnknown: true
    });
    
    if (error) {
      const errorMessages = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));
      
      console.log('Validation error', { 
        path: req.path,
        errors: errorMessages 
      });
      
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid request data',
          details: errorMessages
        }
      });
    }
    
   
    req[source] = value;
    req.validatedData = value;
    
    next();
  };
};

module.exports = validate;