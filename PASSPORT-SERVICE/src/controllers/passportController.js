const { asyncHandler } = require('../Utility/error');
const PassportService= require("../service/passportService")
const verifyPassport =asyncHandler(async (req, res) => {
     console.log("PASSPORT SERVICE BEGAN");
     const {passport_number}= req.body

   const passportRecord=await PassportService(passport_number)

    console.log(`Passport verification successful: ${passport_number}`);

    return res.status(200).json({
      success: true,
      data: {
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
        pages: passportRecord.pages
      }
    });
  
  }
);

module.exports = {
  verifyPassport
};