const GetBvnService=require("../service/BvnService")
const {asyncHandler, NotFoundError}=require("../utility/error")

const verifyBVN = asyncHandler(async (req, res, next)=>{
 
const {bvn}=req.validatedData
 const record = await GetBvnService(bvn)


 return res.status(200).json({success: true,
  data: {
    ...record
  }})
})


module.exports = { verifyBVN };