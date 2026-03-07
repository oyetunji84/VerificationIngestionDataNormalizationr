const Passport = require("../../model/passportModel");

const AuditLog = require("../../model/LogModel");
const billingService = require("../../service/billingService/billingService");
const AppError = require("../../utils/error");

class PassportService {
  async verify(id, organization, idempotencyKey) {
    const Result = await billingService.chargeWallet(
      organization._id.toString(),
      "PASSPORT",
      idempotencyKey,
    );

    if (!Result.success) {
      let statusCode = 500;
      let errorCode = "BILLING500";

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
        billingResult.message || "Billing failed",
        statusCode,
        errorCode,
      );
    }

    try {
      const record = await Passport.findOne({ passportNumber: id });

      if (!record) {
        await this.logAudit(
          organization._id,
          id,

          "NOT_FOUND",
          [],
        );
        throw new AppError("Passport not found", 404, "NOT_FOUND");
      }

      const responseData = {
        passportNumber: record.passportNumber,
        firstName: record.firstName,
        lastName: record.lastName,
        dateOfBirth: record.dateOfBirth,
        expiryDate: record.expiryDate,
        issueDate: record.issueDate,
        nationality: record.nationality,
        image: record.image,
      };
      const fieldsAccessed = Object.keys(responseData);

      await this.logAudit(organization._id, id, "SUCCESS", fieldsAccessed);

      return { found: true, data: responseData };
    } catch (error) {
      throw error;
    }
  }

  async logAudit(organizationId, searchId, status, fieldsAccessed) {
    return AuditLog.create({
      organizationId,
      verificationType: "PASSPORT",
      searchId,
      status,
      fieldsAccessed,
    });
  }
}

module.exports = new PassportService();
