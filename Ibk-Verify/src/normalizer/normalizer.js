const moment = require("moment");
const axios = require("axios");

class normalize {
  normalizeGender(gender) {
    if (!gender) return null;
    const g = gender.toUpperCase();
    if (g === "M" || g === "MALE") return "Male";
    if (g === "F" || g === "FEMALE") return "Female";
    return gender;
  }

  normalizeDate(date) {
    if (!date) return null;
    return moment(date).format("DD-MM-YYYY");
  }

  async imageToBase64(url) {
    if (!url || typeof url !== "string") return null;
    try {
      const parsedUrl = new URL(url);
      if (!["http:", "https:"].includes(parsedUrl.protocol)) {
        return null;
      }
    } catch (e) {
      console.warn(`Skipping image conversion: Invalid URL format - ${url}`);
      return null;
    }

    try {
      const response = await axios.get(url, {
        responseType: "arraybuffer",
        timeout: 5000,
      });

      const base64 = Buffer.from(response.data, "binary").toString("base64");
      const mimeType = response.headers["content-type"];
      return `data:${mimeType};base64,${base64}`;
    } catch (error) {
      console.error("IMAGE TO BASE64 CONVERSION FAILED");
      console.error("URL:", url);
      console.error("Error Message:", error.message);
      if (error.code) console.error("Error Code:", error.code);
      return null;
    }
  }

  async normalize(type, data = {}) {
    switch (type) {
      case "NIN":
        specific = {
          firstName: data.firstName,
          lastName: data.lastName,
          dateOfBirth: this.normalizeDate(data.dateOfBirth),
          verifiedAt: this.normalizeDate(new Date()),
          verificationType: type,
          idNumber: data.nin,
          middleName: data.middleName,
          gender: this.normalizeGender(data.gender),
          phone: data.phone,
          address: data.address,
          photo: await this.imageToBase64(data.image),
        };
        break;

      case "BVN":
        specific = {
          firstName: data.firstName,
          lastName: data.lastName,
          dateOfBirth: this.normalizeDate(data.dateOfBirth),
          verifiedAt: this.normalizeDate(new Date()),
          verificationType: type,
          idNumber: data.bvn,
          middleName: data.middleName,
          phone: data.phone,
          enrollmentBank: data.enrollmentBank,
          photo: await this.imageToBase64(data.image),
        };
        break;

      case "PASSPORT":
        specific = {
          firstName: data.firstName,
          lastName: data.lastName,
          dateOfBirth: this.normalizeDate(data.dateOfBirth),
          verifiedAt: this.normalizeDate(new Date()),
          verificationType: type,
          idNumber: data.passportNumber,
          expiryDate: this.normalizeDate(data.expiryDate),
          issueDate: this.normalizeDate(data.issueDate),
          nationality: data.nationality,
          photo: null,
        };
        break;

      case "DRIVERS_LICENSE":
        specific = {
          firstName: data.firstName,
          lastName: data.lastName,
          dateOfBirth: this.normalizeDate(data.dateOfBirth),
          verifiedAt: this.normalizeDate(new Date()),
          verificationType: type,
          idNumber: data.licenseNumber,
          expiryDate: this.normalizeDate(data.expiryDate),
          issuedDate: this.normalizeDate(data.issuedDate),
          class: data.class,
          stateOfIssue: data.stateOfIssue,
          photo: null,
        };
        break;

      default:
        specific = {};
    }

    return {
      ...specific,
    };
  }
}

module.exports = new normalize();
