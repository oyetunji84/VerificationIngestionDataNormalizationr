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
    return record
    }catch(error){
        throw error
    }
}
module.exports=GetBvnService