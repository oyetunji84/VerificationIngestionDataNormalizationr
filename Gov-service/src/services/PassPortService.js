const { debitWallet } = require("./WalletService");
const {
  findVerificationRecordPassport,
} = require("../repository/verifyRepository");
const { NotFoundError } = require("../utility/error");
const { AMOUNT_IN_KOBO } = require("../utility/config");
const verifyPassport = async (passportNumber, companyId, requestId) => {
  try {
    console.log("Verifying Passport", { passportNumber, companyId, requestId });
    const result = await debitWallet({
      requestId,
      companyId,
      amountInKobo: AMOUNT_IN_KOBO,
      description: "Passport verification request",
    });
    if (!result) {
      throw new NotFoundError(
        "Failed to debit wallet for Passport verification",
        {
          companyId,
          requestId,
        },
      );
    }
    const record = await findVerificationRecordPassport(passportNumber);
    if (!record) {
      throw new NotFoundError(
        `Passport record with number ${passportNumber} not found`,
      );
    }
    return { status: true, record };
  } catch (error) {
    throw error;
  }
};
module.exports = { verifyPassport };
