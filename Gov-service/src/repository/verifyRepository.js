const {
  PassportModel,
  NinModel,
  LicenseModel,
  BvnModel,
} = require("../model/index");
const { NotFoundError } = require("../utility/error");
const findVerificationRecordNin = async (ninNumber) => {
  try {
    const record = await NinModel.findOne({ ninNumber });
    if (!record) {
      throw new NotFoundError(`NIN record with number ${ninNumber} not found`);
    }
    return record;
  } catch (error) {
    console.error("Error finding NIN record:", error);
    throw error;
  }
};
const findVerificationRecordBvn = async (bvnNumber) => {
  try {
    const record = await BvnModel.findOne({ bvn_number:bvnNumber });
    if (!record) {
      throw new NotFoundError(`BVN record with number ${bvnNumber} not found`);
    }
    return record;
  } catch (error) {
    console.error("Error finding BVN record:", error);
    throw error;
  }
};

const findVerificationRecordPassport = async (passportNumber) => {
  try {
    const record = await PassportModel.findOne({ passportNumber });
    if (!record) {
      throw new NotFoundError(
        `Passport record with number ${passportNumber} not found`,
      );
    }
    return record;
  } catch (error) {
    console.error("Error finding Passport record:", error);
    throw error;
  }
};

const findVerificationRecordLicense = async (licenseNumber) => {
  try {
    const record = await LicenseModel.findOne({ LicenseNo:licenseNumber });
    if (!record) {
      throw new NotFoundError(
        `Driver's License record with number ${licenseNumber} not found`,
      );
    }
    return record;
  } catch (error) {
    console.error("Error finding Driver's License record:", error);
    throw error;
  }
};
module.exports = {
  findVerificationRecordNin,
  findVerificationRecordBvn,
  findVerificationRecordPassport,
  findVerificationRecordLicense,
};
