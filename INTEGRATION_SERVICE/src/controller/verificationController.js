const { v4: uuidv4 } = require("uuid");
const ninClient = require("../service/ninService");
const bvnClient = require("../service/bvnService");
const licenseClient = require("../service/licenseService");
const passportClient = require("../service/passportService");

const { asyncHandler } = require("../../utility/error");

const verifyNIN = asyncHandler(async (req, res, next) => {
  // Idempotency key
  const idempotencyKey =
    req.header("x-idempotency-key") ||
    req.header("X-IDEMPOTENCY-KEY") ||
    uuidv4();
  console.log(idempotencyKey);
  const { nin } = req.validatedData;
  const companyId = req.company?.id;
  console.log("NIN verification request", {
    idempotencyKey,
    nin,
    companyId,
  });
  const { data: job } = await ninClient.paidVerifyNin({
    idempotencyKey,
    companyId,
    nin,
    apiKey: req.apiKey,
  });

  return res.status(202).json({
    success: true,
    message: "Verification request accepted and is being processed",
    data: job,
  });
});
const verifyBVN = asyncHandler(async (req, res, next) => {
  const idempotencyKey =
    req.header("x-idempotency-key") ||
    req.header("X-IDEMPOTENCY-KEY") ||
    uuidv4();

  const { bvn } = req.validatedData;
  const company = req.company;
  console.log("BVN verification request", {
    idempotencyKey,
    bvn,
    companyId: company._id,
  });
  const { data: normalizedData } = await bvnClient.paidVerifyBVN({
    idempotencyKey,
    companyId: company._id,
    bvn,
    apiKey: req.apiKey,
  });

  return res.status(200).json({
    success: true,
    message: "Verification successful",
    data: normalizedData,
  });
});
const verifyLicense = asyncHandler(async (req, res, next) => {
  const idempotencyKey =
    req.header("x-idempotency-key") ||
    req.header("X-IDEMPOTENCY-KEY") ||
    uuidv4();
  const { licenseNumber } = req.validatedData;
  const company = req.company;

  console.log("License verification request", {
    idempotencyKey,
    licenseNumber,
    companyId: company._id,
  });

  const { data: normalizedData } = await licenseClient.paidVerifyLicense({
    idempotencyKey,
    companyId: company._id,
    licenseNumber,
    apiKey: req.apiKey,
  });

  return res.status(200).json({
    success: true,
    message: "Verification successful",
    data: normalizedData,
    idempotencyKey,
  });
});

const verifyPassport = asyncHandler(async (req, res, next) => {
  const IdempotencyKey =
    req.header("x-idempotency-key") ||
    req.header("X-IDEMPOTENCY-KEY") ||
    uuidv4();
  const { passportNumber } = req.validatedData;
  const company = req.company;

  console.log("Passport verification request", {
    idempotencyKey: IdempotencyKey,
    passportNumber,
    companyId: company._id,
  });

  const { data: normalizedData } = await passportClient.paidVerifyPassport({
    idempotencyKey: IdempotencyKey,
    companyId: company._id,
    passportNumber,
    apiKey: req.apiKey,
  });

  return res.status(200).json({
    success: true,
    message: "Verification successful",
    data: normalizedData,
    requestId,
  });
});
const getVerificationStatus = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const companyId = req.company?.id;
  console.log("Get verification status request", {
    requestId: id,
    companyId,
  });

  return res.status(200).json({
    success: true,
    message: "Verification status retrieved",
    data: statusData,
  });
});

module.exports = {
  verifyNIN,
  verifyBVN,
  verifyLicense,
  verifyPassport,
};
