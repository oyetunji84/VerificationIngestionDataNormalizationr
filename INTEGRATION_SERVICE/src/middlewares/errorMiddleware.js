
const errorHandler = (err, req, res, next) => {
  console.log('Error occurred', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    ip: req.ip,
    apiKey: req.apiKey ? req.apiKey.substring(0, 10) + '...' : 'none'
  });
  const statusCode = err.statusCode || err.status || 500;
  
    const errorCode = err.code || 'INTERNAL_ERROR';
  
  const errorResponse = {
    success: false,
    error: {
      code: errorCode,
      message: err.message || 'An unexpected error occurred'
    }
  };
  
    res.status(statusCode).json(errorResponse);
};

const notFoundHandler = (req, res) => {
  console.log('Route not found', {
    path: req.path,
    method: req.method,

  });
  
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Route ${req.method} ${req.path} not found`
    }
  });
};

module.exports = {
  errorHandler,
  notFoundHandler
};