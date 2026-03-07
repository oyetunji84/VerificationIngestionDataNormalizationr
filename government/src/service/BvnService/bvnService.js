const BVN = require("../../model/BvnModel");

const LogAudit = require("../../model/LogModel");
const billingService = require("../billingService/billingService");
const AppError = require("../../utils/error");

class BVNService {
  async verify(id, organization, idempotencyKey) {
    const billingResult = await billingService.chargeWallet(
      organization._id.toString(),
      "BVN",
      idempotencyKey,
    );

    if (!billingResult.success) {
      let statusCode = 500;
      let errorCode = "BILLING500";

      switch (billingResult.error) {
        case "INSUFFICIENT_FUNDS":
          statusCode = 402; // Payment Required
          errorCode = "BILLING402";
          break;
        case "WALLET_SUSPENDED":
          statusCode = 403; // Forbidden
          errorCode = "BILLING403";
          break;
        case "WALLET_NOT_FOUND":
          statusCode = 404; // Not Found
          errorCode = "BILLING404";
          break;
        default:
          statusCode = 500;
          errorCode = "BILLING500";
      }

      throw new AppError(
        billingResult.message || "Billing failed",
        statusCode,
        errorCode,
      );
    }

    try {
      const record = await BVN.findOne({ bvn: id });
      console.log(record);
      if (!record) {
        await this.logAudit(
          organization._id,
          id,

          "NOT_FOUND",
          [],
        );
        throw new AppError("BVN not found", 404, "NOT_FOUND");
      }
      const {
        bvn,
        firstName,
        lastName,
        middleName,
        dateOfBirth,
        phone,
        enrollmentBank,
        image,
      } = record;
      const fieldsAccessed = Object.keys({
        bvn,
        firstName,
        lastName,
        middleName,
        dateOfBirth,
        phone,
        enrollmentBank,
        image,
      });

      console.log(record);
      await this.logAudit(
        organization._id,
        id,
        purpose,
        mode,
        "SUCCESS",
        fieldsAccessed,
      );

      return {
        found: true,
        data: {
          bvn,
          firstName,
          lastName,
          middleName,
          dateOfBirth,
          phone,
          enrollmentBank,
          image,
        },
      };
    } catch (error) {
      throw error;
    }
  }

  async logAudit(
    organizationId,
    searchId,
    purpose,
    mode,
    status,
    fieldsAccessed,
  ) {
    return LogAudit.create({
      organizationId,
      verificationType: "BVN",
      searchId,
      status,
      fieldsAccessed,
    });
  }
}

module.exports = new BVNService();
