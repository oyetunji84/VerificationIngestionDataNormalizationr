const DriversLicense = require("../../model/LicenseModel");
const AuditLog = require("../../model/LogModel");
const billingService = require("../../service/billingService/billingService");
const AppError = require("../../utils/error");

class DLService {
  async verify(id, organization, idempotencyKey) {
    const billingResult = await billingService.chargeWallet(
      organization._id.toString(),
      "DRIVERS_LICENSE",
      idempotencyKey,
    );

    if (!billingResult.success) {
      let statusCode = 500;
      let errorCode = "500";

      switch (billingResult.error) {
        case "INSUFFICIENT_FUNDS":
          statusCode = 402;
          errorCode = "402";
          break;
        case "WALLET_SUSPENDED":
          statusCode = 403;
          errorCode = "403";
          break;
        case "WALLET_NOT_FOUND":
          statusCode = 404;
          errorCode = "404";
          break;
        default:
          statusCode = 500;
          errorCode = "00";
      }

      throw new AppError(
        billingResult.message || "Billing failed",
        statusCode,
        errorCode,
      );
    }

    try {
      const record = await DriversLicense.findOne({ licenseNumber: id });

      if (!record) {
        await this.logAudit(organization._id, id, "NOT_FOUND", []);
        throw new AppError("Drivers License not found", 404, "NOT_FOUND");
      }
      const fieldsAccessed = Object.keys({
        licenseNumber: record.licenseNumber,
        firstName: record.firstName,
        lastName: record.lastName,
        dateOfBirth: record.dateOfBirth,
        expiryDate: record.expiryDate,
        issuedDate: record.issuedDate,
        class: record.class,
        stateOfIssue: record.stateOfIssue,
        image: record.image,
      });

      await this.logAudit(organization._id, id, "SUCCESS", fieldsAccessed);

      return { found: true, data: responseData };
    } catch (error) {
      throw error;
    }
  }

  async logAudit(organizationId, searchId, status, fieldsAccessed) {
    return AuditLog.create({
      organizationId,
      verificationType: "DRIVERS_LICENSE",
      searchId,
      status,
      fieldsAccessed,
    });
  }
}

module.exports = new DLService();
