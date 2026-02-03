const NinModel = require("../model/NinModel");

const verifyNIN = async (req, res) => {
  try {
    const { nin } = req.body;

    if (!nin || !/^[0-9]{11}$/.test(nin)) {
      return res.status(400).json({
        success: false,
        error: {
          code: "INVALID_NIN_FORMAT",
          message: "NIN must be exactly 11 digits"
        }
      });
    }
    const record = await NinModel.findOne({ ninNumber: nin });

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