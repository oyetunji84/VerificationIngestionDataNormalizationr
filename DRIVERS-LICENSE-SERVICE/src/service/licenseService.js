const LicenseModel= require("../models/LicenseModel")
const {NotFoundError}= require("../Utility/error")
const LicenseService= async (license_number)=>{
    try{
        const record = await LicenseModel.findOne({ LicenseNo: license_number });


    if (!record) {
        throw new NotFoundError("License")
    }
    console.log(`License verification successful: ${license_number}`);
    return record
    }catch(error){
        throw error
    }
}

module.exports=LicenseService