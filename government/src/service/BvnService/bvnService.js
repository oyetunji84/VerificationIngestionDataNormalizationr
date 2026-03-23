const BVN = require("../../model/BvnModel");
const BaseVerificationService = require("../BaseVerificationService");
class BVNService extends BaseVerificationService {
  constructor() {
    super("BVN", BVN);
  }
  async findRecord(id) {
    return this.Model.findOne({ passportNumber: id });
  }
  buildResponse(record) {
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
    return {
      bvn,
      firstName,
      lastName,
      middleName,
      dateOfBirth,
      phone,
      enrollmentBank,
      image,
    };
  }
}

module.exports = new BVNService();
