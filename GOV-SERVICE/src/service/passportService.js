const PassportRecord = require("../model/passportModel");
const { NotFoundError } = require("../Utility/error");
const PassportService = async (passport_number) => {
  try {
    const passportRecord = await PassportRecord.findOne({
      passportNumber: passport_number,
    });
    console.log(passportRecord);
    if (!passportRecord) {
      throw new NotFoundError("PASSPORT");
    }
    console.log(`PASSPORT verification successful: ${passport_number}`);
    return {
      passportNumber: passportRecord.passportNumber,
      surname: passportRecord.surname,
      givenNames: passportRecord.givenNames,
      dateOfBirth: passportRecord.dateOfBirth,
      sex: passportRecord.sex,
      placeOfBirth: passportRecord.placeOfBirth,
      nationality: passportRecord.nationality,
      issueDate: passportRecord.issueDate,
      expiryDate: passportRecord.expiryDate,
      issuingAuthority: passportRecord.issuingAuthority,
      passportType: passportRecord.passportType,
      photo: passportRecord.photo_filename,
      nin_linked: passportRecord.nin_linked,
      pages: passportRecord.pages,
    };
  } catch (error) {
    throw error;
  }
};

module.exports = PassportService;
