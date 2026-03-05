const amqp = require("amqplib");
require("dotenv").config();

let connection = null;
let channel = null;

async function getChannel() {
  if (channel) return channel;
  console.log("Connecting to RabbitMQ...");

  connection = await amqp.connect(process.env.RABBITMQ_URL);
  channel = await connection.createConfirmChannel();
  connection.on("connect", () => {
    console.log("a connection on rabbitmq started");
  });

  connection.on("disconnect", () => {
    console.log("Disconnected");
  });
  connection.on("error", (err) => {
    console.error("RabbitMQ connection error", err);
    channel = null;
    connection = null;
  });
  channel.on("error", (err) => {
    console.log({ err }, "RabbitMQ channel error");
    channel = null;
  });
  console.log(
    "Connected to RabbitMQ",
    { url: process.env.RABBITMQ_URL },
    // channel,
  );
  return channel;
}
async function closeRabbitMqConnection() {
  try {
    if (channel) await channel.close();
    if (connection) await connection.close();
    console.log("RabbitMQ connection closed gracefully");
  } catch (err) {
    console.log({ err }, "Error closing RabbitMQ connection");
  }
}

module.exports = { getChannel, channel, closeRabbitMqConnection };
