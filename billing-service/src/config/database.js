const { Sequelize } = require("sequelize");
const env = require("./env");
const logger = require("../utils/logger");

const sequelize = new Sequelize(env.db.name, env.db.user, env.db.password, {
  host: env.db.host,
  port: Number(env.db.port),
  dialect: "postgres",
  logging: (sql) => logger.debug(sql),
  pool: {
    max: 10,
    min: 2,
    acquire: 30000,
    idle: 10000,
  },
});

const connectDatabase = async () => {
  await sequelize.authenticate();
  //   await sequelize.sync({ alter: env.NODE_ENV !== "production" });
  logger.info("Billing DB connected and synced");
};

module.exports = { sequelize, connectDatabase };
