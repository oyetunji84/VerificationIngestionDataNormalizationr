const { v4: uuidv4 } = require("uuid");
const ninClient = require("../service/ninService");
const bvnClient = require("../service/bvnService");
const licenseClient = require("../service/licenseService");
const passportClient = require("../service/passportService");

const { asyncHandler } = require("../../utility/error");
const { getVerificationResult } = require("../service/verificationService");
const { buildTraceContextFromHeaders } = require("../infra/traceContext");

const verifyNIN = asyncHandler(async (req, res) => {
  const idempotencyKey =
    req.header("x-idempotency-key") ||
    req.header("X-IDEMPOTENCY-KEY") ||
    uuidv4();

  const { nin } = req.validatedData;
  const companyId = req.company?.id;
  const traceContext = buildTraceContextFromHeaders(req.headers);

  const { data: job } = await ninClient.paidVerifyNin({
    idempotencyKey,
    companyId,
    nin,
    apiKey: req.apiKey,
    traceId: traceContext.traceId,
    traceparent: traceContext.traceparent,
  });

  return res.status(202).json({
    success: true,
    message: "Verification request accepted and is being processed",
    data: job,
  });
});

const verifyBVN = asyncHandler(async (req, res) => {
  const idempotencyKey =
    req.header("x-idempotency-key") ||
    req.header("X-IDEMPOTENCY-KEY") ||
    uuidv4();

  const { bvn } = req.validatedData;
  const companyId = req.company?.id;
  const traceContext = buildTraceContextFromHeaders(req.headers);

  const { data: normalizedData } = await bvnClient.paidVerifyBVN({
    idempotencyKey,
    companyId,
    bvn,
    apiKey: req.apiKey,
    traceId: traceContext.traceId,
    traceparent: traceContext.traceparent,
  });

  return res.status(200).json({
    success: true,
    message: "Verification successful",
    data: normalizedData,
  });
});

const verifyLicense = asyncHandler(async (req, res) => {
  const idempotencyKey =
    req.header("x-idempotency-key") ||
    req.header("X-IDEMPOTENCY-KEY") ||
    uuidv4();

  const { licenseNumber } = req.validatedData;
  const companyId = req.company?.id;
  const traceContext = buildTraceContextFromHeaders(req.headers);

  const { data: normalizedData } = await licenseClient.paidVerifyLicense({
    idempotencyKey,
    companyId,
    licenseNumber,
    apiKey: req.apiKey,
    traceId: traceContext.traceId,
    traceparent: traceContext.traceparent,
  });

  return res.status(200).json({
    success: true,
    message: "Verification successful",
    data: normalizedData,
    idempotencyKey,
  });
});

const verifyPassport = asyncHandler(async (req, res) => {
  const idempotencyKey =
    req.header("x-idempotency-key") ||
    req.header("X-IDEMPOTENCY-KEY") ||
    uuidv4();

  const { passportNumber } = req.validatedData;
  const companyId = req.company?.id;
  const traceContext = buildTraceContextFromHeaders(req.headers);

  const { data: normalizedData } = await passportClient.paidVerifyPassport({
    idempotencyKey,
    companyId,
    passportNumber,
    apiKey: req.apiKey,
    traceId: traceContext.traceId,
    traceparent: traceContext.traceparent,
  });

  return res.status(200).json({
    success: true,
    message: "Verification successful",
    data: normalizedData,
    idempotencyKey,
  });
});

const getVerificationStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const companyId = req.company?.id;

  const statusData = await getVerificationResult(id, companyId);

  return res.status(200).json({
    success: true,
    data: statusData,
  });
});

module.exports = {
  verifyNIN,
  verifyBVN,
  verifyLicense,
  verifyPassport,
  getVerificationStatus,
};
