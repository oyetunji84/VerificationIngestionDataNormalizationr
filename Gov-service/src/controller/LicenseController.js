const { asyncHandler } = require("../utility/error");
const { verifyLicense } = require("../services/LicenseService");
const { v4: uuidv4 } = require("uuid");

const verifyLicenseController = asyncHandler(async (req, res) => {
  const companyId = req.company?.id;
  const requestId =
    req.header("x-idempotency-key") ||
    req.header("X-IDEMPOTENCY-KEY") ||
    uuidv4();

  const { license_number } = req.validatedData;

  const { status, record } = await verifyLicense(
    license_number,
    companyId,
    requestId,
  );

  return res.status(200).json({
    success: status,
    data: record,
    requestId,
  });
});

module.exports = { verifyLicenseController };

