const mongoose = require("mongoose");

const MONGO_URI =
  process.env.MONGO_URI || "mongodb://localhost:27017/gov-provider";

mongoose.set("bufferCommands", false);
mongoose.set(
  "bufferTimeoutMS",
  Number(process.env.MONGO_BUFFER_TIMEOUT_MS || 3000),
);

const connectMongoDb = async () => {
  try {
    await mongoose.connect(MONGO_URI, {});
    console.log("Connected to MongoDB (Government Provider)");
  } catch (err) {
    console.error("MongoDB connection error:", err);
    throw err;
  }
};
const disconnectMongoDB = async () => {
  try {
    await mongoose.connection.close(false);
  } catch (err) {
    console.error("Error disconnecting MongoDB", err);
  }
};

module.exports = { connectMongoDb, disconnectMongoDB };
