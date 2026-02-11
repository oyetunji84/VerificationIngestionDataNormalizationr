const { verifyNINWithBilling } = require("../service/ninService");
const { asyncHandler } = require("../Utility/error");
const { v4: uuidv4 } = require("uuid");

const verifyNIN = asyncHandler(async (req, res) => {
  const { nin } = req.body;

  const companyId = req.company?.id;
  const requestId =
    req.header("x-idempotency-key") ||
    req.header("X-IDEMPOTENCY-KEY") ||
    uuidv4();

  const result = await verifyNINWithBilling({
    ninNumber: nin,
    requestId,
    companyId,
  });

  const record = result.data;

  return res.status(200).json({
    success: true,
    requestId: result.requestId,
    data: {
      ninNumber: record.ninNumber,
      firstName: record.firstName,
      middleName: record.middleName,
      lastName: record.lastName,
      dob: record.dob,
      gender: record.gender,
      phone: record.phone,
      email: record.email,
      residentialAddress: record.residentialAddress,
      stateOfOrigin: record.stateOfOrigin,
      lga: record.lga,
      height: record.height,
      maritalStatus: record.maritalStatus,
      image: record.image, // base64 with data URI
      enrollmentDate: record.enrollmentDate,
      status: record.status,
    },
  });
});

module.exports = { verifyNIN };
