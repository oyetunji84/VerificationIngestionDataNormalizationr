const { v4: uuidv4 } = require('uuid');
const ninClient = require('../service/ninService');
const bvnClient = require('../service/bvnService');
const licenseClient = require('../service/licenseService');
const passportClient = require('../service/passportService');
const {ninNormalize,bvnNormalize,passportNormalize,licenseNormalize} = require('../../normalizer/normalizer');

const { logVerification } = require('../service/historyService');


const verifyNIN = async (req, res, next) => {
  const requestId = uuidv4();
   
  try {
    const { nin } = req.validatedData;
    const company = req.company;
    
    console.log('NIN verification request', { requestId,  nin, companyId: company._id });
    

    const rawResponse = await ninClient.verifyNIN(nin);
    
    const normalizedData = await ninNormalize(rawResponse);
    
    logVerification({
      apiKey: req.apiKey,
      serviceType: 'NIN',
      status: normalizedData.status.toUpperCase(),
      requestId,

    }).catch(err => {
      console.error('Failed to log verification', { requestId, error: err.message });
    });
    
    return res.status(200).json({
      success: true,
      message: 'Verification successful',
      data: normalizedData,
      requestId
    });
    
  } catch (error) {
    logVerification({
      apiKey: req.apiKey,
      serviceType: 'NIN',
      status: 'FAILED',
      requestId,
      errorMessage: error.message,
      errorCode: error.code || 'VERIFICATION_ERROR',
    }).catch(err => {
      console.error('Failed to log failed verification', { requestId, error: err.message });
    });
    
    next(error);
  }
};
const verifyBVN = async (req, res, next) => {
  const requestId = uuidv4();
  
  try {
    const {  bvn } = req.validatedData;
    const company = req.company;
    
    console.log('BVN verification request', { requestId, bvn, companyId: company._id });
    

    const rawResponse = await bvnClient.verifyBVN(bvn);

    const normalizedData = await bvnNormalize(rawResponse);

    logVerification({
      apiKey: req.apiKey,
      serviceType: 'BVN',
      status: normalizedData.status.toUpperCase(),
      requestId,
    }).catch(err => {
      console.error('Failed to log verification', { requestId, error: err.message });
    });
    
    return res.status(200).json({
      success: true,
      message: 'Verification successful',
      data: normalizedData,
      requestId
    });
    
  } catch (error) {
     
    logVerification({
      apiKey: req.apiKey,
      serviceType: 'BVN',
      status: 'FAILED',
      requestId,
      errorMessage: error.message,
      errorCode: error.code || 'VERIFICATION_ERROR',
     }).catch(err => {
      console.error('Failed to log failed verification', { requestId, error: err.message });
    });
    
    next(error);
  }
};

const verifyLicense = async (req, res, next) => {
  const requestId = uuidv4();
  
  try {
    const { licenseNumber } = req.validatedData;
    const company = req.company;
    
    console.log('License verification request', { requestId,  licenseNumber, companyId: company._id });
    
    const rawResponse = await licenseClient.verifyLicense(licenseNumber);
     const normalizedData = await licenseNormalize(rawResponse);
      logVerification({
      apiKey: req.apiKey,
      serviceType: 'DRIVERS_LICENSE',
      status: normalizedData.status.toUpperCase(),
      requestId,
     }).catch(err => {
      console.error('Failed to log verification', { requestId, error: err.message });
    });
    
    return res.status(200).json({
      success: true,
      message: 'Verification successful',
      data: normalizedData,
      requestId
    });
    
  } catch (error) {
        
    logVerification({
      apiKey: req.apiKey,
      serviceType: 'DRIVERS_LICENSE',
      status: 'FAILED',
      requestId,
      errorMessage: error.message,
      errorCode: error.code || 'VERIFICATION_ERROR',
    
    }).catch(err => {
      console.error('Failed to log failed verification', { requestId, error: err.message });
    });
    
    next(error);
  }
};

const verifyPassport = async (req, res, next) => {
  const requestId = uuidv4();
  
  try {
    const {  passportNumber } = req.validatedData;
    const company = req.company;
    
    console.log('Passport verification request', { requestId,  passportNumber, companyId: company._id });
    
    const rawResponse = await passportClient.verifyPassport(passportNumber);
    
    const normalizedData = await passportNormalize(rawResponse);
    
    
    logVerification({
      apiKey: req.apiKey,
      serviceType: 'PASSPORT',
      status: normalizedData.status.toUpperCase(),
      requestId,
    }).catch(err => {
      console.error('Failed to log verification', { requestId, error: err.message });
    });
    
    return res.status(200).json({
      success: true,
      message: 'Verification successful',
      data: normalizedData,
      requestId
    });
    
  } catch (error) {
    
    
    logVerification({
      apiKey: req.apiKey,
      serviceType: 'PASSPORT',
      status: 'FAILED',
      requestId,
      errorMessage: error.message,
      errorCode: error.code || 'VERIFICATION_ERROR',
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    }).catch(err => {
      console.error('Failed to log failed verification', { requestId, error: err.message });
    });
    
    next(error);
  }
};

module.exports = {
  verifyNIN,
  verifyBVN,
  verifyLicense,
  verifyPassport
};