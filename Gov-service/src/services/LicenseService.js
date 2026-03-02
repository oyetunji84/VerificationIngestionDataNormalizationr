const { debitWallet } = require("./WalletService");
const {
  findVerificationRecordLicense,
} = require("../repository/verifyRepository");
const { NotFoundError } = require("../utility/error");
const { AMOUNT_IN_KOBO } = require("../utility/config");
const verifyLicense = async (licenseNumber, companyId, requestId) => {
  try {
    console.log("Verifying License", { licenseNumber, companyId, requestId });
    const result = await debitWallet({
      requestId,
      companyId,
      amountInKobo: AMOUNT_IN_KOBO,
      description: "License verification request",
    });
    if (!result) {
      throw new NotFoundError(
        "Failed to debit wallet for License verification",
        {
          companyId,
          requestId,
        },
      );
    }
    const record = await findVerificationRecordLicense(licenseNumber);
    if (!record) {
      throw new NotFoundError(
        `License record with number ${licenseNumber} not found`,
      );
    }
    return { status: true, record };
  } catch (error) {
    throw error;
  }
};
module.exports = { verifyLicense };
