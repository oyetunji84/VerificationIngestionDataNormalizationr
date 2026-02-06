const LicenseModel = require('../models/LicenseModel');

const Joi = require('joi');

const verifyLicenseSchema = Joi.object({
  license_number: Joi.string()
    .min(5)
    .max(15)
    .required()
    .messages({
      'string.min': 'License number must be at least 5 characters',
      'string.max': 'License number cannot exceed 15 characters',
      'any.required': 'License number is required'
    })
});

const verifyLicense = async (req, res) => {
  try {
    console.log(`License Model service started`)
    const { error, value } = verifyLicenseSchema.validate(req.body);
    
    if (error) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: error.details[0].message
        }
      });
    }

    const { license_number } = value;


    // Query database
    const licenseRecord = await LicenseModel.findOne({ LicenseNo: license_number });

    if (!licenseRecord) {
      console.log(`License not found: ${license_number}`);
      return res.status(404).json({
        success: false,
        error: {
          code: 'LICENSE_NOT_FOUND',
          message: 'No record found for the provided license number'
        }
      });
    }

    console.log(`License verification successful: ${license_number}`);

   
    return res.status(200).json({
      success: true,
      data: {
        LicenseNo: licenseRecord.LicenseNo,
        FirstName: licenseRecord.FirstName,
        MiddleName: licenseRecord.MiddleName,
        LastName: licenseRecord.LastName,
        BirthDate: licenseRecord.BirthDate,
        Gen: licenseRecord.Gen,
        BloodGroup: licenseRecord.BloodGroup,
        HeightCm: licenseRecord.HeightCm,
        ResidentialAddr: licenseRecord.ResidentialAddr,
        StateOfIssue: licenseRecord.StateOfIssue,
        LicenseClass: licenseRecord.LicenseClass,
        IssuedDate: licenseRecord.IssuedDate,
        ExpiryDate: licenseRecord.ExpiryDate,

      }
    });

  } catch (error) {
    console.error('License verification error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An error occurred while processing your request'
      }
    });
  }
};

module.exports = {
  verifyLicense
};