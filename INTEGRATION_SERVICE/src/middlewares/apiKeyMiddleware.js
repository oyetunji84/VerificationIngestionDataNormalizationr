const { validateApiKey } = require('../service/companyService');



const apiKeyAuth = async (req, res, next) => {
  try {
    const apiKey = req.headers['x-api-key'];
    
    if (!apiKey) {
      console.log('API key missing in request', { 
        path: req.path,
        ip: req.ip 
      });
      
      return res.status(401).json({
        success: false,
        error: {
          code: 'API_KEY_REQUIRED',
          message: 'API key is required. Please provide x-api-key header.'
        }
      });
    }
    

    const company = await validateApiKey(apiKey);
    
    if (!company) {
      console.log('Invalid or revoked API key', { 
        path: req.path,
        ip: req.ip,
        apiKeyPrefix: apiKey.substring(0, 10)
      });
      
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_API_KEY',
          message: 'Invalid or revoked API key.'
        }
      });
    }
    
    
    req.company = company;
    req.apiKey = apiKey;
    
    console.log('API key validated', { 
      companyId: company._id,
      companyName: company.companyName,
      path: req.path
    });
    
    next();
    
  } catch (error) {
    console.log('Error in API key authentication', { error: error.message });
    
    return res.status(500).json({
      success: false,
      error: {
        code: 'AUTH_ERROR',
        message: 'Authentication error occurred.'
      }
    });
  }
};

module.exports = apiKeyAuth;