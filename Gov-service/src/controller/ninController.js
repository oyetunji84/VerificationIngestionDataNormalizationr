const { asyncHandler } = require("../utility/error");
const { verifyNin } = require("../services/NinService");
const { v4: uuidv4 } = require("uuid");

const verifyNinController = asyncHandler(async (req, res) => {
  const companyId = req.company?.id;
  const requestId =
    req.header("x-idempotency-key") ||
    req.header("X-IDEMPOTENCY-KEY") ||
    uuidv4();

  const { nin } = req.validatedData;

  const { status, record } = await verifyNin(nin, companyId, requestId);

  return res.status(200).json({
    success: status,
    data: record,
    requestId,
  });
});

module.exports = { verifyNinController };

