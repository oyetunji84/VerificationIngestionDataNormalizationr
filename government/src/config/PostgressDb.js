const { Sequelize } = require("sequelize");

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: "postgres",
  logging: false, // Set to console.log to see SQL queries
  pool: {
    max: 5,
    min: 0,
    acquire: 5000,
    idle: 10000,
  },
  dialectOptions: {
    connectTimeout: 5000,
  },
});

const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log("Connected to PostgreSQL ");
    const v = await sequelize.sync();
    // console.log(v);
  } catch (error) {
    console.error("PostgreSQL connection error:", error);
    throw error;
  }
};

module.exports = { sequelize, connectDB };
