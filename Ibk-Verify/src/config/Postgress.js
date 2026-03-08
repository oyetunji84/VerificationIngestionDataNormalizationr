const { Sequelize } = require("sequelize");

const sequelize = new Sequelize(process.env.POSTGRES_URL, {
  dialect: "postgres",
  logging: false,
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
});

const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log("Connected to PostgreSQL (Gateway Billing)");
  } catch (error) {
    console.error("Gateway PostgreSQL connection error:", error);
    process.exit(1);
  }
};

module.exports = { sequelize, connectDB };
