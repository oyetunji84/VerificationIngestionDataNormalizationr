const BaseVerificationService = require("../BaseVerificationService");
const Passport = require("../../model/passportModel");

class PassportService extends BaseVerificationService {
  constructor() {
    super("PASSPORT", Passport);
  }
  async findRecord(id) {
    return this.Model.findOne({ passportNumber: id });
  }
  buildResponse(record) {
    const {
      passportNumber,
      firstName,
      lastName,
      dateOfBirth,
      expiryDate,
      issueDate,
      nationality,
      image,
    } = record;
    return {
      passportNumber,
      firstName,
      lastName,
      dateOfBirth,
      expiryDate,
      issueDate,
      nationality,
      image,
    };
  }
}

module.exports = new PassportService();
