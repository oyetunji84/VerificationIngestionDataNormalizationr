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
    console.log("RabbitMQ connection established");
  });

  connection.on("disconnect", () => {
    console.log("RabbitMQ disconnected");
  });

  connection.on("error", (err) => {
    console.error("RabbitMQ connection error", err);
    channel = null;
    connection = null;
  });

  channel.on("error", (err) => {
    console.error("RabbitMQ channel error", err);
    channel = null;
  });

  console.log("Connected to RabbitMQ", {
    url: process.env.RABBITMQ_URL,
  });

  return channel;
}

async function closeRabbitMqConnection() {
  try {
    if (channel) await channel.close();
    if (connection) await connection.close();
    console.log("RabbitMQ connection closed gracefully");
  } catch (err) {
    console.error("Error closing RabbitMQ connection", err);
  }
}

module.exports = { getChannel, channel, closeRabbitMqConnection };
