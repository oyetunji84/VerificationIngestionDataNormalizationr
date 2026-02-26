const LicenseModel = require("../model/LicenseModel");
const { NotFoundError } = require("../Utility/error");
const LicenseService = async (license_number) => {
  try {
    const record = await LicenseModel.findOne({ LicenseNo: license_number });

    if (!record) {
      throw new NotFoundError("License");
    }
    console.log(`License verification successful: ${license_number}`);
    return {
      LicenseNo: record.LicenseNo,
      FirstName: record.FirstName,
      MiddleName: record.MiddleName,
      LastName: record.LastName,
      BirthDate: record.BirthDate,
      Gen: record.Gen,
      BloodGroup: record.BloodGroup,
      HeightCm: record.HeightCm,
      ResidentialAddr: record.ResidentialAddr,
      StateOfIssue: record.StateOfIssue,
      IssuedDate: record.IssuedDate,
      ExpiryDate: record.ExpiryDate,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  } catch (error) {
    throw error;
  }
};

module.exports = LicenseService;
