const { debitWallet } = require("./WalletService");
const { findVerificationRecordBvn } = require("../repository/verifyRepository");
const { NotFoundError } = require("../utility/error");
const { AMOUNT_IN_KOBO } = require("../utility/config");
const verifyBvn = async (bvnNumber, companyId, requestId) => {
  try {
    console.log("Verifying BVN", { bvnNumber, companyId, requestId });
    const result = await debitWallet({
      requestId,
      companyId,
      amountInKobo: AMOUNT_IN_KOBO,
      description: "BVN verification request",
    });
    if (!result) {
      throw new NotFoundError("Failed to debit wallet for BVN verification", {
        companyId,
        requestId,
      });
    }
    const record = await findVerificationRecordBvn(bvnNumber);
    console.log("record", record);
    if (!record) {
      // update the ninrequest table
      throw new NotFoundError(`BVN record with number ${bvnNumber} not found`);
    }
    //also update the NIN reequest table here also
    return { status: true, record };
  } catch (error) {
    throw error;
  }
};
module.exports = { verifyBvn };
