const { sequelize } = require("../config/PostgressDb");
const Wallet = require("../model/WalletModel");
const Transaction = require("../model/TransactionModel");

class BillingRepository {
  async findWallet(organizationId, transaction = null) {
    return Wallet.findOne({
      where: { organizationId },
      ...(transaction && { transaction, lock: transaction.LOCK.UPDATE }),
    });
  }

  async findOrCreateWallet(organizationId) {
    const [wallet, created] = await Wallet.findOrCreate({
      where: { organizationId },
      defaults: { organizationId },
    });
    return { wallet, created };
  }

  async incrementWalletBalance(wallet, amount, transaction) {
    await wallet.increment("balance", { by: amount, transaction });
    await wallet.reload({ transaction });
  }

  async decrementWalletBalance(wallet, amount, transaction) {
    await wallet.decrement("balance", { by: amount, transaction });
    await wallet.reload({ transaction });
  }

  async createTransaction(fields, transaction) {
    return Transaction.create(fields, { transaction });
  }

  async getTransactionHistory(walletId, page = 1, limit = 20) {
    const offset = (page - 1) * limit;
    return Transaction.findAndCountAll({
      where: { walletId },
      order: [["createdAt", "DESC"]],
      limit,
      offset,
    });
  }

  async beginTransaction() {
    return sequelize.transaction();
  }
}

module.exports = new BillingRepository();
