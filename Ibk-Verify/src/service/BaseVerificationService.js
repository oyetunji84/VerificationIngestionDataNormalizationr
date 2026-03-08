const axios = require("axios");
const crypto = require("crypto");

class BaseVerificationService {
  constructor(endpoint) {
    if (!endpoint) throw new Error("endpoint is required");
    this.endpoint = endpoint;
    this.baseUrl = process.env.BASE_URL;
    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: 5000,
      headers: {
        "x-api-key": process.env.API_KEY,
      },
    });
  }

  async verify(id, callbackUrl, verificationId) {
    try {
      const response = await this.client.post(
        this.endpoint,
        {
          id,
          callbackUrl,
          verificationId,
        },
        {
          headers: {
            "x-idempotency-key": crypto.randomUUID(),
          },
        },
      );

      return response.data;
    } catch (error) {
      throw this._handleError(error);
    }
  }
  _handleError(error) {
    if (error.response) {
      const customError = new Error(
        error.response.data?.message || error.response.statusText,
      );
      customError.statusCode = error.response.status;
      customError.code = error.response.data?.code;
      return customError;
    }
    return new Error(`Verification failed: ${error.message}`);
  }
}

module.exports = BaseVerificationService;
