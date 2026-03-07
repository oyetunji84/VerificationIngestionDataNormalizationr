const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/PostgressDb.js");

const Wallet = sequelize.define(
  "Wallet",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    organizationId: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    balance: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0.0,
      allowNull: false,
    },
    currency: {
      type: DataTypes.STRING(3),
      defaultValue: "NGN",
    },
    status: {
      type: DataTypes.STRING,
      defaultValue: "ACTIVE",
    },
  },
  {
    timestamps: true,
  },
);

module.exports = Wallet;
