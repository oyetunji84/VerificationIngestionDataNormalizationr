const { DataTypes } = require("sequelize");
const { sequelize } = require("../../../config/database");

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
      type: DataTypes.ENUM("ACTIVE", "SUSPENDED"),
      defaultValue: "ACTIVE",
    },
  },
  {
    timestamps: true,
    indexes: [{ unique: true, fields: ["organizationId"] }],
  },
);

module.exports = Wallet;
