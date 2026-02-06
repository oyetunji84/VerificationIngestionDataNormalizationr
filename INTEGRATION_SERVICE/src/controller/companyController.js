const { registerCompany } = require('../service/companyService');
const register = async (req, res, next) => {
  try {
    const { companyName, companyEmail } = req.validatedData;
    
    console.log('Company registration request', { companyEmail });
    
    const company = await registerCompany({
      companyName,
      companyEmail
    });
    
    console.log('Company registered successfully', { 
      companyId: company._id,
      companyEmail: company.companyEmail 
    });
    
    return res.status(201).json({
      success: true,
      message: 'Company registered successfully',
      data: {
        companyId: company._id,
        companyName: company.companyName,
        companyEmail: company.companyEmail,
        apiKey: company.apiKey,
        status: company.status,
        createdAt: company.createdAt
      },
      warning: 'Please save your API key securely. It will not be shown again.'
    });
    
  } catch (error) {
    if (error.message.includes('already exists')) {
      return res.status(409).json({
        success: false,
        error: {
          code: 'DUPLICATE_EMAIL',
          message: error.message
        }
      });
    }
    
    next(error);
  }
};

module.exports = {
  register
};