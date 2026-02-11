const NinModel = require("../model/NinModel");
const { db } = require("../infra/postgresDb");
const { v4: uuidv4 } = require("uuid");
const { ninRequests } = require("../model/schema/ninRequests");
const walletService = require("./walletService");
const { eq } = require("drizzle-orm");
const { NotFoundError, InsufficientFundsError } = require("../Utility/error");

const COST_IN_NAIRA = 100;
const COST_IN_KOBO = COST_IN_NAIRA * 100;

const buildResultFromRequest = (ninRequest, record) => {
  return {
    success: ninRequest.status === "SUCCESS",
    requestId: ninRequest.requestId,
    status: ninRequest.status,
    charged: ninRequest.charged === "true",
    amountCharged: ninRequest.amountCharged,
    walletTransactionId: ninRequest.walletTransactionId,
    data: record || null,
    error:
      ninRequest.status === "FAILED"
        ? {
            code: ninRequest.errorCode,
            message: ninRequest.errorMessage,
          }
        : null,
  };
};

const verifyNINWithBilling = async ({ ninNumber, requestId, companyId }) => {
  console.log("STARTING NIN verification with billing", {
    ninNumber,
    requestId,
    companyId,
  });

  try {
    // STEP 1: Idempotency – check existing NIN request
    const [existingRequest] = await db
      .select()
      .from(ninRequests)
      .where(eq(ninRequests.requestId, requestId))
      .limit(1);

    if (existingRequest) {
      const existingRecord =
        existingRequest.status === "SUCCESS"
          ? await NinModel.findOne({ ninNumber: existingRequest.ninNumber })
          : null;

      console.log("Idempotent NIN verification request - returning existing");
      return buildResultFromRequest(existingRequest, existingRecord);
    }

    // STEP 2: Check wallet balance
    const balance = await walletService.getBalance(companyId);

    if (balance.balance < COST_IN_KOBO) {
      console.log("Insufficient funds");
      throw new InsufficientFundsError("Insufficient wallet balance", {
        required: COST_IN_KOBO,
        available: balance.balance,
        companyId,
      });
    }

    const debitResult = await walletService.debitWallet({
      amountInKobo: COST_IN_KOBO,
      requestId,
      companyId,
      description: "NIN verification request",
    });

    const [ninRequest] = await db
      .insert(ninRequests)
      .values({
        id: uuidv4(),
        requestId,
        companyId,
        ninNumber,
        status: "PENDING",
        walletTransactionId: debitResult.transaction.id,
        charged: "true",
        amountCharged: COST_IN_KOBO,
      })
      .returning();

    const record = await NinModel.findOne({ ninNumber });

    if (!record) {
      console.log(
        "NIN record not found, marking request as FAILED and refunding",
      );

      await db
        .update(ninRequests)
        .set({
          status: "FAILED",
          errorMessage: "NIN not found",
          errorCode: "404",
          updatedAt: new Date(),
        })
        .where(eq(ninRequests.id, ninRequest.id));

      throw new NotFoundError("NIN");
    }

    await db
      .update(ninRequests)
      .set({
        status: "SUCCESS",
        updatedAt: new Date(),
      })
      .where(eq(ninRequests.id, ninRequest.id));

    console.log(`NIN verification successful: ${ninNumber}`);
    return buildResultFromRequest(
      {
        ...ninRequest,
        status: "SUCCESS",
      },
      record,
    );
  } catch (error) {
    if (
      error instanceof NotFoundError ||
      error instanceof InsufficientFundsError
    ) {
      throw error;
    }

    throw error;
  }
};

module.exports = {
  verifyNINWithBilling,
};
