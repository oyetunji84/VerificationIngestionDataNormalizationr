const { asyncHandler } = require("../utility/error");
const { verifyPassport } = require("../services/PassPortService");
const { v4: uuidv4 } = require("uuid");

const verifyPassportController = asyncHandler(async (req, res) => {
  const companyId = req.company?.id;
  const requestId =
    req.header("x-idempotency-key") ||
    req.header("X-IDEMPOTENCY-KEY") ||
    uuidv4();

  const { passport_number } = req.validatedData;

  const { status, record } = await verifyPassport(
    passport_number,
    companyId,
    requestId,
  );

  return res.status(200).json({
    success: status,
    data: record,
    requestId,
  });
});

module.exports = { verifyPassportController };

