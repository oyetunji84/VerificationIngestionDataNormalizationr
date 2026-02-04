const BvnModel = require("../model/BvnModel");
const Joi = require("joi")


const verifyBVNSchema = Joi.object({
    bvn: Joi.string()
      .length(11)
      .pattern(/^[0-9]{11}$/)
      .required()
      .messages({
        'string.length': 'BVN must be exactly 11 digits',
        'string.pattern.base': 'BVN must contain only numbers',
        'any.required': 'BVN is required'
      })
  });

const verifyBVN = async (req, res) => {
  try {
    console.log(`BVN Service started`)
    const { error, value } = verifyBVNSchema.validate(req.body);
    
    if (error) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: error.details[0].message
        }
      });
    }
    const { bvn } = value;
    const record = await BvnModel.findOne({ bvn_number: `${req.body.bvn}` });


    if (!record) {
      console.warn(`BVN not found: ${bvn}`);
      return res.status(404).json({
        success: false,
        error: { code: "BVN_NOT_FOUND", message: "No record found for the provided BVN" }
      });
    }
    console.log(`BVN verification successful: ${bvn}`);

    return res.status(200).json({
      success: true,
      data: {
        bvn_number:        record.bvn_number,
        first_name:        record.first_name,
        middle_name:       record.middle_name,
        last_name:         record.last_name,
        date_of_birth:     record.date_of_birth,
        gender:            record.gender,
        phone_number:      record.phone_number,
        email_address:     record.email_address,
        enrollment_bank:   record.enrollment_bank,
        enrollment_branch: record.enrollment_branch,
        registration_date: record.registration_date,
        photograph:        record.photograph_filename            // URL — integration service must fetch & convert
      }
    });
  } catch (error) {
    console.error("[BVN-SERVICE] Error:", error);
    return res.status(500).json({
      success: false,
      error: { code: "INTERNAL_ERROR", message: "An internal error occurred" }
    });
  }
};

module.exports = { verifyBVN };