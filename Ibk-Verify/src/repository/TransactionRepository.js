const Transaction = require("../model/TransactionModel");

class TransactionRepository {
  async create(data, transaction = null) {
    return Transaction.create(data, {
      ...(transaction && { transaction }),
    });
  }

  async findOne(where) {
    return Transaction.findOne({ where });
  }

  async findAndCountAll({ walletId, limit, offset }) {
    return Transaction.findAndCountAll({
      where: { walletId },
      order: [["createdAt", "DESC"]],
      limit,
      offset,
    });
  }
}

module.exports = new TransactionRepository();
