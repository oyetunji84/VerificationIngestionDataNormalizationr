const HttpClient = require("../../utility/httpClient");
const httpClient = new HttpClient(config.EXTERNAL_API_URL, {
  retries: 0,
  providerName: "ExternalJobAPI",
});

async function callExternalApi(payload, idempotencyKey) {
  console.log(
    { idempotencyKey },
    "Calling external API (single attempt — queue handles retries)",
  );

  try {
    const data = await httpClient.post(
      "/", // path relative to baseURL set in constructor
      payload,
      {
        idempotencyKey, // picked up by your request interceptor
        headers: {
          "X-Request-ID": idempotencyKey, // for distributed tracing
        },
      },
    );

    console.log({ idempotencyKey }, "External API call succeeded");
    return data;
  } catch (err) {
    if (err.response) {
      const { status, headers, data: responseBody } = err.response;
      if (status === 429) {
        const retryAfterMs = parseRetryAfter(headers["retry-after"]);

        console.log(
          { idempotencyKey, status, retryAfterMs },
          "429 rate limited — will requeue with Retry-After delay (retry count preserved)",
        );

        throw new ExternalApiError({
          message: `External API rate limited (429). Retry after ${retryAfterMs ?? "unknown"}ms`,
          statusCode: 429,
          retryable: true,
          isRateLimited: true, // processJob reads this to skip retry count increment
          retryAfterMs, // processJob passes this as expiration to jobs.retry
          responseBody,
        });
      }

      if (status >= 500) {
        console.log(
          { idempotencyKey, status },
          "5xx server error — will requeue with exponential backoff",
        );

        throw new ExternalApiError({
          message: `External API server error (${status}). Will retry with backoff.`,
          statusCode: status,
          retryable: true, // processJob increments retry_count and publishToRetry
          responseBody,
        });
      }

      console.log(
        { idempotencyKey, status, responseBody },
        `4xx client error (${status}) — non-retryable, publishing to dead letter`,
      );

      throw new ExternalApiError({
        message: `External API rejected our request (${status}). Non-retryable.`,
        statusCode: status,
        retryable: false, // processJob calls publishToDead immediately
        responseBody,
      });
    }

    const isTimeout = err.code === "ECONNABORTED" || err.code === "ETIMEDOUT";

    console.log(
      { idempotencyKey, code: err.code, isTimeout },
      `Network error (${err.code}) — retryable, will requeue`,
    );

    throw new ExternalApiError({
      message: isTimeout
        ? `External API timed out after ${config.EXTERNAL_API_TIMEOUT_MS}ms (${err.code})`
        : `Network error calling external API: ${err.message} (${err.code})`,
      statusCode: null, // no HTTP status — purely network level
      retryable: true, // retry via queue
    });
  }
}
module.exports = { callExternalApi };
