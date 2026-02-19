const BvnModel =require("../model/BvnModel")
const {NotFoundError}=require("../utility/error")
const GetBvnService=async (bvn)=>{
    try{
        const record = await BvnModel.findOne({ bvn_number: `${bvn}` });
        console.log(record);

    if (!record) {
        throw new NotFoundError("BVN")
    }
    console.log(`BVN verification successful: ${bvn}`);
    return {bvn_number: record.bvn_number, first_name: record.first_name, middle_name: record.middle_name, last_name: record.last_name,
    date_of_birth: record.date_of_birth, gender: record.gender, phone_number: record.phone_number,
    email_address: record.email_address, enrollment_bank: record.enrollment_bank,
    enrollment_branch: record.enrollment_branch, registration_date: record.registration_date,
    photograph_filename: record.photograph_filename
}
    }catch(error){
        throw error
    }
}
module.exports=GetBvnService