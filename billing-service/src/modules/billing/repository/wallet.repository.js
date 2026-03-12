const Wallet = require("../models/wallet.model");

class WalletRepository {
  async findByOrganizationId(organizationId, transaction = null) {
    return Wallet.findOne({
      where: { organizationId },
      ...(transaction && { transaction }),
    });
  }

  async findByOrganizationIdWithLock(organizationId, transaction) {
    return Wallet.findOne({
      where: { organizationId },
      transaction,
      lock: transaction.LOCK.UPDATE, // SELECT ... FOR UPDATE — prevents concurrent balance mutations
    });
  }

  async findOrCreate(organizationId) {
    const [wallet, created] = await Wallet.findOrCreate({
      where: { organizationId },
      defaults: { organizationId },
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
