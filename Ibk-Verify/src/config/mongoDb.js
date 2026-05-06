const mongoose = require("mongoose");
const MONGO_URI =
  process.env.MONGO_URI || "mongodb://localhost:27017/Ibkverify-gateway";

mongoose.set("bufferCommands", false);
mongoose.set(
  "bufferTimeoutMS",
  Number(process.env.MONGO_BUFFER_TIMEOUT_MS || 3000),
);

const connectMongoDB = async () => {
  try {
    await mongoose.connect(MONGO_URI, {});
    console.log("Connected to MongoDB (Government Provider)");
  } catch (err) {
    console.error("MongoDB connection error:", err);
    throw err;
  }
};

module.exports = connectMongoDB;
