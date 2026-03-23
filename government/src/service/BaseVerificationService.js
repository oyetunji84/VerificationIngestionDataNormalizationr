const AuditLog = require("../model/LogModel");
const billingService = require("./billingService/billingService");
const AppError = require("../utils/error");

const BILLING_ERROR_MAP = {
  INSUFFICIENT_FUNDS: { statusCode: 402, errorCode: "BILLING402" },
  WALLET_SUSPENDED: { statusCode: 403, errorCode: "BILLING403" },
  WALLET_NOT_FOUND: { statusCode: 404, errorCode: "BILLING404" },
};

class BaseVerificationService {
  constructor(verificationType, model) {
    this.verificationType = verificationType;
    this.Model = model;
  }

  async handleBilling(organizationId, idempotencyKey) {
    const result = await billingService.chargeWallet(
      organizationId,
      this.verificationType,
      idempotencyKey,
    );

    if (!result.success) {
      const { statusCode = 500, errorCode = "BILLING500" } =
        BILLING_ERROR_MAP[result.error] ?? {};

      throw new AppError(
        result.message || "Billing failed",
        statusCode,
        errorCode,
      );
    }
  }

  async findRecord(id) {
    throw new AppError(
      `${this.verificationType}: findRecord() must be implemented by subclass`,
      500,
      "INTERNAL_ERROR",
    );
  }
  buildResponse(record) {
    throw new AppError(
      `${this.verificationType}: buildResponse() must be implemented by subclass`,
      500,
      "INTERNAL_ERROR",
    );
  }

  logAudit(organizationId, searchId, status, fieldsAccessed = []) {
    AuditLog.create({
      organizationId,
      verificationType: this.verificationType,
      searchId,
      status,
      fieldsAccessed,
    }).catch((err) => {
      console.error(
        `[AuditLog] Failed to write audit for ${this.verificationType}:`,
        err,
      );
    });
  }

  async verify(id, organization, idempotencyKey) {
    try {
      await this.handleBilling(organization._id.toString(), idempotencyKey);

      const record = await this.findRecord(id);

      if (!record) {
        this.logAudit(organization._id, id, "NOT_FOUND");
        throw new AppError(
          `${this.verificationType} not found`,
          404,
          "NOT_FOUND",
        );
      }

      const data = this.buildResponse(record);

      this.logAudit(organization._id, id, "SUCCESS", Object.keys(data));

      return { found: true, data };
    } catch (err) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(
        `Verification failed: ${error.message}`,
        500,
        "INTERNAL_ERROR",
      );
    }
  }
}

module.exports = BaseVerificationService;
