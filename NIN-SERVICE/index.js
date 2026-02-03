const express = require('express');
const app = express();
const port = 3000;
const mongoose = require("mongoose");
const cors = require("cors");

const NinRoutes = require("./src/routes/NinRoutes");
const NinModel = require("./src/model/NinModel");

const ninSeeds = require("./mock-data/ninSeeds");
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


app.use(cors());
app.use(express.json());

app.use("/", NinRoutes);

app.get("/health", (req, res) => {
  res.json({ service: "NIN-Provider", status: "running", port: PORT });
});


const startServer = async () => {
  await connectDB();


  const count = await NinModel.countDocuments();
  if (count === 0) {
    console.log("[NIN-SERVICE] Seeding NIN records...");
    await NinModel.insertMany(ninSeeds);
    console.log(`[NIN-SERVICE] Seeded ${ninSeeds.length} NIN records`);
  } else {
    console.log(`[NIN-SERVICE] Already has ${count} NIN records. Skipping seed.`);
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