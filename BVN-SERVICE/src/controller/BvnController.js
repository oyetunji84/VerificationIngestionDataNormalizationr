const GetBvnService=require("../service/BvnService")
const {asyncHandler, NotFoundError}=require("../utility/error")

const verifyBVN = asyncHandler(async (req, res, next)=>{
 
const {bvn}=req.validatedData
 const record = await GetBvnService(bvn)
 
 return res.status(200).json({success: true,
  data: {
    bvn_number:record.bvn_number,
    first_name:record.first_name,
    middle_name:record.middle_name,
    last_name:record.last_name,
    date_of_birth:record.date_of_birth
  }})
})


module.exports = { verifyBVN };