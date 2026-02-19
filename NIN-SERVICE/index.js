const express = require('express');
const app = express();
const port = 3000;
const mongoose = require("mongoose");
const cors = require("cors");
const { connectRedis } = require("./src/infra/redisDb");
const { postgresDb } = require("./src/infra/postgresDb");
const NinRoutes = require("./src/routes/NinRoutes");
const WalletRoutes = require("./src/routes/WalletRoutes");
const NinModel = require("./src/model/NinModel");
const { loadScript } = require("./src/middleware/rateLimitHelper");
const ninSeeds = require("./mock-data/ninSeeds");
const { errorHandler } = require('./src/Utility/error');
require('dotenv').config()

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);

    console.log(`[NIN-SERVICE] MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`[NIN-SERVICE] MongoDB Connection Error: ${error.message}`);
    process.exit(1);
  }
};

const PORT = process.env.PORT || 4001;
app.use((req, res, next) => {
  function normalizeEndpoint(path) {
    return path
      .replace(/^\/api\//, "")
      .replace(/^\/|\/$/g, "")
      .replace(/\//g, "-")
      .toLowerCase();
  }
  console.log("Incoming request", {
    method: req.method,
    path: normalizeEndpoint(req.path),
    ip: req.ip,
    userAgent: req.get("user-agent"),
  });

  next();
});

app.use(cors());
app.use(express.json());


app.use("/", NinRoutes);
app.use("/", WalletRoutes);

app.get("/health", (req, res) => {
  res.json({ service: "NIN-Provider", status: "running", port: PORT });
});

app.use(errorHandler)
const startServer = async () => {

  await connectDB();
  await postgresDb();
  await connectRedis();
    await loadScript();
  await NinModel.deleteMany();
  // console.log(ninSeeds)
  const count = await NinModel.countDocuments();
  if (count === 0) {
    console.log("[NIN-SERVICE] Seeding NIN records...");
    await NinModel.insertMany(ninSeeds);
    console.log(`[NIN-SERVICE] Seeded ${ninSeeds.length} NIN records`);
  } else {
    console.log(
      `[NIN-SERVICE] Already has ${count} NIN records. Skipping seed.`,
    );
  }

  app.listen(PORT, () => {
    console.log(`[NIN-SERVICE] Server running on http://localhost:${PORT}`);
  });
};


startServer();
connectDB();
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});         