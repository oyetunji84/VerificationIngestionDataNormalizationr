const { debitWallet } = require("./WalletService");
const { findVerificationRecordNin } = require("../repository/verifyRepository");
const { NotFoundError } = require("../utility/error");
const { AMOUNT_IN_KOBO } = require("../utility/config");
const verifyNin = async (ninNumber, companyId, requestId) => {
  try {
    console.log("Verifying NIN", { ninNumber, companyId, requestId });
    const result = await debitWallet({
      requestId,
      companyId,
      amountInKobo: AMOUNT_IN_KOBO,
      description: "NIN verification request",
    });
    if (!result) {
      throw new NotFoundError("Failed to debit wallet for NIN verification", {
        companyId,
        requestId,
      });
    }
    const record = await findVerificationRecordNin(ninNumber);
    if (!record) {
      throw new NotFoundError(`NIN record with number ${ninNumber} not found`);
    }
    return { status: true, record };
  } catch (error) {
    throw error;
  }
};
module.exports = { verifyNin };
