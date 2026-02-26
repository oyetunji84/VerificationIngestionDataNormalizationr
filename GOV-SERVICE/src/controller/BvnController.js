const GetBvnService = require("../service/BvnService");
const { asyncHandler, NotFoundError } = require("../Utility/error");
const { publishToQueue } = require("../infra/setUpQueue");
const verifyBVN = asyncHandler(async (req, res, next) => {
  const { bvn, callBackUrl } = req.validatedData;

  // const record = await GetBvnService(bvn);

  publishToQueue({ bvn, callBackUrl });

  return res.status(202).json({
    success: true,
    data: {
      message: "Its being processed",
    },
  });
});

module.exports = { verifyBVN };
