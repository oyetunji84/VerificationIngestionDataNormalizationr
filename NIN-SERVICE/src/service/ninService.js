const NinModel= require("../model/NinModel")
const {NotFoundError}=require("../Utility/error")
const NinService= async (nin)=>{
    try{
        const record = await NinModel.findOne({ ninNumber: nin });


    if (!record) {
        throw new NotFoundError("NIN")
    }
    console.log(`NIN verification successful: ${nin}`);
    return record
    }catch(error){
        throw error
    }
}

module.exports=LicenseService