const NIN = require("../../model/ninModel");
const BaseVerificationService = require("../BaseVerificationService");

class NINService extends BaseVerificationService {
  constructor() {
    super("NIN", NIN);
  }

  async findRecord(id) {
    return this.Model.findOne({ nin: id });
  }

  buildResponse(record) {
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
    return {
      nin,
      firstName,
      lastName,
      middleName,
      dateOfBirth,
      gender,
      address,
      phone,
      image,
    };
  }
}

module.exports = new NINService();
