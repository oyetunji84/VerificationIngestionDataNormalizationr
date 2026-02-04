const PassportRecord = require('../models/passportModel');

const Joi = require('joi');

const verifyPassportSchema = Joi.object({
  passport_number: Joi.string()
    .min(7)
    .max(10)
    .alphanum()
    .required()
    .messages({
      'string.min': 'Passport number must be at least 7 characters',
      'string.max': 'Passport number cannot exceed 10 characters',
      'string.alphanum': 'Passport number must be alphanumeric',
      'any.required': 'Passport number is required'
    })
});

const verifyPassport = async (req, res) => {
  try {
    console.log("PASSPORT SERVICE BEGAN");
    const { error, value } = verifyPassportSchema.validate(req.body);
    
    if (error) {
        console.error("Passport error validation error");
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: error.details[0].message
        }
      });
    }

    const { passport_number } = value;

    const passportRecord = await PassportRecord.findOne({ passportNumber: passport_number });

    if (!passportRecord) {
          console.warn(`Passport not found: ${passport_number}`);
      return res.status(404).json({
        success: false,
        error: {
          code: 'PASSPORT_NOT_FOUND',
          message: 'No record found for the provided passport number'
        }
      });
    }

    console.log(`Passport verification successful: ${passport_number}`);

    return res.status(200).json({
      success: true,
      data: {
        passportNumber: passportRecord.passportNumber,
        surname: passportRecord.surname,
        givenNames: passportRecord.givenNames,
        dateOfBirth: passportRecord.dateOfBirth,
        sex: passportRecord.sex,
        placeOfBirth: passportRecord.placeOfBirth,
        nationality: passportRecord.nationality,
        issueDate: passportRecord.issueDate,
        expiryDate: passportRecord.expiryDate,
        issuingAuthority: passportRecord.issuingAuthority,
        passportType: passportRecord.passportType,
        photo: passportRecord.photo_filename,
        nin_linked: passportRecord.nin_linked,
        pages: passportRecord.pages
      }
    });

  } catch (error) {
    console.error('Passport verification error:', error);
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
  verifyPassport
};