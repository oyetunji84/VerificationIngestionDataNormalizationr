const PassportRecord = require("../models/passportModel")
const {NotFoundError}=require("../Utility/error")
const PassportService= async (passport_number)=>{
    try{

        const record = await PassportRecord.findOne({ passportNumber: passport_number });
console.log(record);
    if (!record) {
        throw new NotFoundError("PASSPORT")
    }
    console.log(`PASSPORT verification successful: ${passport_number}`);
    return record
    }catch(error){
        throw error
    }
}

module.exports=PassportService