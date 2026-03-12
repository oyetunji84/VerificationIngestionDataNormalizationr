require("dotenv").config("../../.env");
const CompanyModel = require("../model/CompanyModel.js");
// const { hashApiKey } = require("../utils/apikey.util");
const { hashApiKey } = require("../utils/apiKey.util");

const authenticate = async (req, res, next) => {
  try {
    const apiKey = req.headers["x-api-key"];
    const pepper = process.env.API_KEY_PEPPER;

    if (!pepper) {
      return res.status(500).json({
        code: "500",
        message: "API_KEY_PEPPER is not configured",
      });
    }

    if (!apiKey) {
      return res.status(401).json({
        code: "401",
        message: "MISSING AUTHENTICATION HEADER (x-api-key)",
      });
    }

    const keyHash = hashApiKey(apiKey, pepper);
    console.log(keyHash);
    // console.log(await CompanyModel.findOne({ clientSecret: keyHash }));
    const organization = await CompanyModel.findOne({ clientSecret: keyHash });
    // console.log(organization);
    if (!organization) {
      return res.status(401).json({
        code: "401",
        message: "INVALID API KEY",
      });
    }

    if (organization.status !== "ACTIVE") {
      return res.status(403).json({
        code: "403",
        message: "ORGANIZATION SUSPENDED",
      });
    }

    req.company = organization;
    console.log("for company", req.company);
    next();
  } catch (error) {
    console.error("Auth Error:", error);
    return res.status(500).json({
      code: "SERVER_ERROR",
      message: "INTERNAL SERVER ERROR",
    });
  }
};

module.exports = authenticate;
