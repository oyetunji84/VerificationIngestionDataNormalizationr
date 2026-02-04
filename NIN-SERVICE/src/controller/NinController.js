const NinModel = require("../model/NinModel");
const Joi= require("joi")
const verifyNINSchema = Joi.object({
  nin: Joi.string()
    .length(11)
    .pattern(/^[0-9]{11}$/)
    .required()
    .messages({
      'string.length': 'NIN must be exactly 11 digits',
      'string.pattern.base': 'NIN must contain only numbers',
      'any.required': 'NIN is required'
    })
});
const verifyNIN = async (req, res) => {
  try {
    console.log(`NINSERVIE: controller begining`)
    const { error, value } = verifyNINSchema.validate(req.body);
    
    if (error) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: error.details[0].message
        }
      });
    }

    const { nin } = value;

    const record = await NinModel.findOne({ ninNumber: nin });

    console.log(`NIN verification successful: ${nin}`);
    if (!record) {
      return res.status(404).json({
        success: false,
        error: {
          code: "NIN_NOT_FOUND",
          message: "No record found for the provided NIN"
        }
      });
    }


    return res.status(200).json({
      success: true,
      data: {
        ninNumber: record.ninNumber,
        firstName: record.firstName,
        middleName: record.middleName,
        lastName: record.lastName,
        dob: record.dob,                        
        gender: record.gender,                
        phone: record.phone,
        email: record.email,
        residentialAddress: record.residentialAddress,
        stateOfOrigin: record.stateOfOrigin,
        lga: record.lga,
        height: record.height,
        maritalStatus: record.maritalStatus,
        image: record.image,                     // base64 with data URI
        enrollmentDate: record.enrollmentDate,
        status: record.status
      }
    });
  } catch (error) {
    console.error("[NIN-SERVICE] Error verifying NIN:", error);
    return res.status(500).json({
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "An internal error occurred"
      }
    });
  }
};

module.exports = { verifyNIN };