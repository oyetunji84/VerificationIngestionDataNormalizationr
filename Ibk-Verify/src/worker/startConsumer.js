const {
  getChannel,
  VERIFICATION_MAIN_QUEUE,
  publishToRetryQueue,
} = require("../config/rabbitmq");
const verificationService = require("../service/verifyService");
const logModel = require("../model/LogModel");
const billingService = require("../service/Billing/BillingService");
const { extractTraceContext } = require("../utils/tracing");
const { context, trace, SpanStatusCode } = require("@opentelemetry/api");

const MAX_RETRIES = 5;
const tracer = trace.getTracer("IBK-VERIFY");

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
      if (msg !== null) {
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
            await logModel.findByIdAndUpdate(logId, {
              status: "PROCESSING",
            });

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

            const log = await logModel.findById(logId);
            const currentRetries = log.retryCount || 0;

            if (currentRetries < MAX_RETRIES) {
              const delay = Math.pow(2, currentRetries) * 1000;

              console.log(
                `Retrying job ${logId} in ${delay}ms (Attempt ${currentRetries + 1}/${MAX_RETRIES})`,
              );

              await logModel.findByIdAndUpdate(logId, {
                status: "PENDING",
                retryCount: currentRetries + 1,
                errorMessage: `Processing failed. Retrying in ${delay}ms... (${error.message})`,
              });

              publishToRetryQueue(jobData, delay, { headers });
              channel.ack(msg);
            } else {
              console.error(
                `Job ${logId} failed permanently after ${MAX_RETRIES} retries.`,
              );

              await logModel.findByIdAndUpdate(logId, {
                status: "FAILED",
                errorMessage: `Verification failed after ${MAX_RETRIES} retries: ${error.message}`,
                completedAt: new Date(),
              });

              try {
                await billingService.refundWallet(
                  companyId,
                  type.toUpperCase(),
                  `refund_failed_${logId}`,
                );
                console.log(`Refunded client for job ${logId}`);
              } catch (refundError) {
                console.error(
                  `Failed to refund client for job ${logId}:`,
                  refundError,
                );
              }

              channel.nack(msg, false, false);
            }
          } finally {
            span.end();
          }
        });
      }
    },
    { noAck: false },
  );
};

module.exports = { startWorker };
