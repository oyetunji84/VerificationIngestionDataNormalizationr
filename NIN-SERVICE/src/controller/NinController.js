const NinService = require("../service/ninService");
const { asyncHandler } = require("../Utility/error");
const verifyNIN= asyncHandler(async (req, res)=>{
  const {nin}=req.body
  const record= await NinService(nin)
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
  })
})
module.exports = { verifyNIN };