const axios = require("axios");
const axiosRetry = require("axios-retry");
const { v4: uuidv4 } = require('uuid')
class HttpClient {
  constructor(baseURL, options = {}) {
    this.client = axios.create({
      baseURL,
      timeout: options.timeout || 10000,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    });

    axiosRetry.default(this.client, {
      retries: options.retries || 3,
      retryDelay: axiosRetry.exponentialDelay,
      retryCondition: (error) => {
        return (
          axiosRetry.isNetworkOrIdempotentRequestError(error) ||
          (error.response && error.response.status >= 500)
        );
      },
    });

    this.setupInterceptors(options);
  }

  setupInterceptors({ providerName, onError }) {
    this.client.interceptors.request.use(
      (config) => {
        config.metadata = { startTime: Date.now() };
        if (config.method && ["post", "put", "patch"].includes(config.method)) {
          config.headers["X-IDEMPOTENCY-KEY"] =
            config.idempotencyKey || uuidv4();
        }

        console.log(
          `[${providerName}] Request: ${config.method.toUpperCase()} ${config.url}`,
          {
            requestId: config.headers["X-Request-ID"],
            data: config.data,
          },
        );
        return config;
      },
      (error) => Promise.reject(error),
    );

    this.client.interceptors.response.use(
      (response) => {
        const duration = Date.now() - response.config.metadata.startTime;
        console.log(`[${providerName}] Response: ${response.status}`, {
          requestId: response.config.headers["X-Request-ID"],
          duration,
          data: response.data,
        });
        return response;
      },
      async (error) => {
        if (onError) {
          return onError(error);
        }
        return Promise.reject(error);
      },
    );
  }

  async request(config) {
    try {
      const response = await this.client.request(config);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  get(url, params = {}, config = {}) {
    return this.request({ method: "GET", url, params, ...config });
  }

  post(url, data = {}, config = {}) {
    return this.request({ method: "POST", url, data, ...config });
  }
}

module.exports = HttpClient;
