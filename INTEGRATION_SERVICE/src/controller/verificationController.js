const { v4: uuidv4 } = require('uuid');
const ninClient = require('../service/ninService');
const bvnClient = require('../service/bvnService');
const licenseClient = require('../service/licenseService');
const passportClient = require('../service/passportService');

const { asyncHandler } = require('../../utility/error');


const verifyNIN = asyncHandler( async (req, res, next) => {
  const requestId = uuidv4();

  const { nin } = req.validatedData;
  const company = req.company;
  console.log('NIN verification request', { requestId,  nin, companyId: company._id });
  const { data: normalizedData } = await ninClient.paidVerifyNin({
      requestId,
      companyId: company._id,
      nin,
      apiKey: req.apiKey
    });

    return res.status(200).json({
      success: true,
      message: 'Verification successful',
      data: normalizedData,
    });
    
  
});
const verifyBVN = asyncHandler(async (req, res, next) => {
  const requestId = uuidv4();

  const { bvn } = req.validatedData;
  const company = req.company;
  console.log('BVN verification request', { requestId, bvn, companyId: company._id });
  const { data: normalizedData } = await bvnClient.paidVerifyBVN({
      requestId,
      companyId: company._id,
      bvn,
      apiKey: req.apiKey
    });
   

    return res.status(200).json({
      success: true,
      message: 'Verification successful',
      data: normalizedData,
    });
});
const verifyLicense = asyncHandler(async (req, res, next) => {
  const requestId = uuidv4();
  const { licenseNumber } = req.validatedData;
    const company = req.company;

    console.log('License verification request', { requestId,  licenseNumber, companyId: company._id });

    const { data: normalizedData } = await licenseClient.paidVerifyLicense({
      requestId,
      companyId: company._id,
      licenseNumber,
      apiKey: req.apiKey
    });
    
    return res.status(200).json({
      success: true,
      message: 'Verification successful',
      data: normalizedData,
      requestId
    });
     
});

const verifyPassport = asyncHandler(async (req, res, next) => {
  const requestId = uuidv4();

  const {  passportNumber } = req.validatedData;
    const company = req.company;

    console.log('Passport verification request', { requestId,  passportNumber, companyId: company._id });

    const { data: normalizedData } = await passportClient.paidVerifyPassport({
      requestId,
      companyId: company._id,
      passportNumber,
      apiKey: req.apiKey
    });
   
    
    
    
    return res.status(200).json({
      success: true,
      message: 'Verification successful',
      data: normalizedData,
      requestId
    });    
    
});

module.exports = {
  verifyNIN,
  verifyBVN,
  verifyLicense,
  verifyPassport
};