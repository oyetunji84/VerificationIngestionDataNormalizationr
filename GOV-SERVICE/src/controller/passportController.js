const { asyncHandler } = require("../Utility/error");
const PassportService = require("../service/passportService");
const verifyPassport = asyncHandler(async (req, res) => {
  console.log("PASSPORT SERVICE BEGAN");
  const { passport_number } = req.body;

  const result = await PassportService(passport_number);

  console.log(`Passport verification successful: ${passport_number}`);

  return res.status(200).json({
    success: true,
    data: { ...result },
  });
});

module.exports = {
  verifyPassport,
};
