const DriversLicense = require("../../model/LicenseModel");
const BaseVerificationService = require("../BaseVerificationService");

class DLService extends BaseVerificationService {
  constructor() {
    super("DRIVERS_LICENSE", DriversLicense);
  }

  async findRecord(id) {
    return this.Model.findOne({ licenseNumber: id });
  }

  buildResponse(record) {
    const {
      licenseNumber,
      firstName,
      lastName,
      dateOfBirth,
      expiryDate,
      issuedDate,
      class: licenseClass,
      stateOfIssue,
      image,
    } = record;
    return {
      licenseNumber,
      firstName,
      lastName,
      dateOfBirth,
      expiryDate,
      issuedDate,
      class: licenseClass,
      stateOfIssue,
      image,
    };
  }
}

module.exports = new DLService();
