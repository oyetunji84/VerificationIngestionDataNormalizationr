const LicenseService = require("../service/licenseService");
const { asyncHandler } = require("../Utility/error");

const verifyLicense = asyncHandler(async (req, res)=>{
  console.log("Its in LIcense controller now")
  const {license_number}=req.body
 const record = await LicenseService(license_number)
 
 return res.status(200).json({success: true,
  data: {
...record  
}})
})

module.exports = {
  verifyLicense
};