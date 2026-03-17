const NIN = require("../../model/ninModel");

const LogModel = require("../../model/LogModel");
const billingService = require("../billingService/billingService");
const AppError = require("../../utils/error");

class NINService {
  async verify(id, organization, idempotencyKey) {
    console.log(id);
    const Result = await billingService.chargeWallet(
      organization._id.toString(),
      "NIN",
      idempotencyKey,
    );
    console.log(Result);

    if (!Result.success) {
      let statusCode = 500;
      let errorCode = "500";

      switch (Result.error) {
        case "INSUFFICIENT_FUNDS":
          statusCode = 402; // Payment Required
          errorCode = "402";
          break;
        case "WALLET_SUSPENDED":
          statusCode = 403; // Forbidden
          errorCode = "403";
          break;
        case "WALLET_NOT_FOUND":
          statusCode = 404; // Not Found
          errorCode = "404";
          break;
        default:
          statusCode = 500;
          errorCode = "500";
      }

      throw new AppError(
        Result.message || "Billing failed",
        statusCode,
        errorCode,
      );
    }

    try {
      console.log(id);
      console.log(await NIN.findOne({}));
      const record = await NIN.findOne({ nin: id });
      console.log(record);
      if (!record) {
        await this.logAudit(organization._id, id, "NOT_FOUND", []);
        throw new AppError("NIN not found", 404, "NOT_FOUND");
      }
      const {
        nin,
        firstName,
        lastName,
        middleName,
        dateOfBirth,
        gender,
        address,
        phone,
        image,
      } = record;
      const fieldsAccessed = Object.keys({
        nin,
        firstName,
        lastName,
        middleName,
        dateOfBirth,
        gender,
        address,
        phone,
        image,
      });
      await this.logAudit(
        organization._id,
        id,

        "SUCCESS",
        fieldsAccessed,
      );
      console.log(record);
      return {
        found: true,
        data: {
          nin,
          firstName,
          lastName,
          middleName,
          dateOfBirth,
          gender,
          address,
          phone,
          image,
        },
      };
    } catch (error) {
      throw error;
    }
  }

  async logAudit(organizationId, searchId, status, fieldsAccessed) {
    return LogModel.create({
      organizationId,
      verificationType: "NIN",
      searchId,
      status,
      fieldsAccessed,
    });
  }
}

module.exports = new NINService();
