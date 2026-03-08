const Wallet = require("../model/WalletModel");

class WalletRepository {
  async findByCompanyId(companyId, transaction = null) {
    return Wallet.findOne({
      where: { companyId },
      ...(transaction && { transaction }),
    });
  }

  async findByCompanyIdWithLock(companyId, transaction) {
    return Wallet.findOne({
      where: { companyId },
      transaction,
      lock: transaction.LOCK.UPDATE,
    });
  }

  async findOrCreate(companyId) {
    const [wallet, created] = await Wallet.findOrCreate({
      where: { companyId },
      defaults: { companyId },
    });
    return { wallet, created };
  }

  async incrementBalance(wallet, amount, transaction) {
    await wallet.increment("balance", { by: amount, transaction });
    await wallet.reload({ transaction });
    return wallet;
  }

  async decrementBalance(wallet, amount, transaction) {
    await wallet.decrement("balance", { by: amount, transaction });
    await wallet.reload({ transaction });
    return wallet;
  }
}

module.exports = new WalletRepository();
