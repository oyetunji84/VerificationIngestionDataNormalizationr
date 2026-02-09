const { ValidationError } = require("../Utility/error");

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
        

       return  next(new ValidationError("Invalid request data", errorMessages))        
      }
      
     
      req[source] = value;
      req.validatedData = value;
      
      next();
    };
  };
  


module.exports=validate