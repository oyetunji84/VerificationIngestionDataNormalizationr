const {
  getChannel,
  VERIFICATION_MAIN_QUEUE,
  publishToRetryQueue,
} = require("../config/rabbitmq");
const verificationService = require("../service/verifyService");
const logModel = require("../model/LogModel");
const billingService = require("../service/Billing/billingGrpcService"); // ← Step 13 swap
const { extractTraceContext } = require("../utils/tracing");
const { context, trace, SpanStatusCode } = require("@opentelemetry/api");
const {
  classifyGrpcError,
  getRetryDelayMs,
  TERMINAL,
} = require("../utils/grpcErrorClassifer");

const MAX_RETRIES = 5;
const tracer = trace.getTracer(process.env.OTEL_SERVICE_NAME);

const startWorker = () => {
  const channel = getChannel();
  if (!channel) {
    console.error("RabbitMQ channel not available. Worker cannot start.");
    setTimeout(startWorker, 5000);
    return;
  }

  console.log("Verification worker started. Waiting for jobs...");
  channel.prefetch(20);

  channel.consume(
    VERIFICATION_MAIN_QUEUE,
    async (msg) => {
      if (!msg) return;

      const headers = msg.properties?.headers || {};
      const jobData = JSON.parse(msg.content.toString());
      const { logId, type, companyId } = jobData;

      const ctx = extractTraceContext(headers);

      await context.with(ctx, async () => {
        const span = tracer.startSpan("verification.consume", {
          attributes: {
            "messaging.system": "rabbitmq",
            "messaging.destination": VERIFICATION_MAIN_QUEUE,
            "verification.log_id": logId,
          },
        });

        try {
          await logModel.findByIdAndUpdate(logId, { status: "PROCESSING" });
          await verificationService.processJob(jobData);

          channel.ack(msg);
          span.setStatus({ code: SpanStatusCode.OK });
          console.log(`Job ${logId} processed successfully.`);
        } catch (error) {
          span.recordException(error);
          span.setStatus({
            code: SpanStatusCode.ERROR,
            message: error.message,
          });
          console.error(`Error processing job ${logId}:`, error.message);

          const { classification, reason } = classifyGrpcError(error);
          console.error(
            `Job ${logId} error classification: [${classification}] ${reason}`,
          );

          if (classification === TERMINAL) {
            await logModel.findByIdAndUpdate(logId, {
              status: "FAILED",
              errorMessage: error.grpcMessage || error.message,
              completedAt: new Date(),
            });

            channel.ack(msg);
            return;
          }

          const log = await logModel.findById(logId);
          const currentRetries = log.retryCount || 0;

          if (currentRetries < MAX_RETRIES) {
            const delay = getRetryDelayMs(error, currentRetries);

            console.log(
              `Retrying job ${logId} in ${delay}ms ` +
                `(Attempt ${currentRetries + 1}/${MAX_RETRIES})`,
            );

            await logModel.findByIdAndUpdate(logId, {
              status: "PENDING",
              retryCount: currentRetries + 1,
              errorMessage: `Retrying in ${delay}ms: ${error.message}`,
            });

            publishToRetryQueue(jobData, delay, { headers });
            channel.ack(msg);
          } else {
            console.error(
              `Job ${logId} permanently failed after ${MAX_RETRIES} retries.`,
            );

            await logModel.findByIdAndUpdate(logId, {
              status: "FAILED",
              errorMessage: `Failed after ${MAX_RETRIES} retries: ${error.message}`,
              completedAt: new Date(),
            });

            try {
              await billingService.refundWallet(
                companyId,
                type.toUpperCase(),
                `refund_failed_${logId}`,
              );
              console.log(
                `Refunded client for permanently failed job ${logId}`,
              );
            } catch (refundError) {
              console.error(
                `Refund failed for job ${logId}:`,
                refundError.message,
              );
            }

            channel.nack(msg, false, false);
          }
        } finally {
          span.end();
        }
      });
    },
    { noAck: false },
  );
};

module.exports = { startWorker };
