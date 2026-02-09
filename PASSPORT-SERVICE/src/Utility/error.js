
class AppError extends Error {
    constructor(message, statusCode, isOperational = true, metadata = {}) {
      super(message);
      
      this.statusCode = statusCode;
      this.isOperational = isOperational;
      this.metadata = metadata;
      this.timestamp = new Date().toISOString();
      
      Error.captureStackTrace(this, this.constructor);
    }
  }
  
  class ValidationError extends AppError {
    constructor(message, metadata = {}) {
      super(message, 400, true, metadata);
      this.name = 'ValidationError';
    }
  }
  
  class NotFoundError extends AppError {
    constructor(resource, metadata = {}) {
      super(`${resource} not found`, 404, true, metadata);
      this.name = 'NotFoundError';
    }
  }
  
  class UnauthorizedError extends AppError {
    constructor(message = 'Unauthorized access', metadata = {}) {
      super(message, 401, true, metadata);
      this.name = 'UnauthorizedError';
    }
  }
  
  class DatabaseError extends AppError {
    constructor(message, metadata = {}) {
      super(message, 500, true, metadata);
      this.name = 'DatabaseError';
    }
  }
  
  class ExternalServiceError extends AppError {
    constructor(service, message, metadata = {}) {
      super(`${service} error: ${message}`, 503, true, metadata);
      this.name = 'ExternalServiceError';
    }
  }
  

const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
  
const errorHandler = (err, req, res, next) => {

  let error = { ...err };
  error.message = err.message;
  error.statusCode = err.statusCode || 500;
  error.isOperational = err.isOperational || false;
  error.metadata= err.metadata || {}
   res.status(error.statusCode).json({
    success: false,
    error: {
      message: error.message,
      isOperational: error.isOperational? `is-Operational`:`not operational`,
      metadata:error.metadata
    }
  });
};


  module.exports = {
    errorHandler,
    asyncHandler,
    AppError,
    ValidationError,
    NotFoundError,
    UnauthorizedError,
    DatabaseError,
    ExternalServiceError
  };