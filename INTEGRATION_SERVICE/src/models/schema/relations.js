const { relations } = require("drizzle-orm");

const { wallets } = require("./wallets");

const { walletTransactions } = require("./walletTransactions");



const walletRelations = relations(wallets, ({ one, many }) => ({

  transactions: many(walletTransactions),
}));

const walletTransactionRelations = relations(walletTransactions, ({ one }) => ({
  wallet: one(wallets, {
    fields: [walletTransactions.walletId],
    references: [wallets.id],
  }),
}));

module.exports = {
  walletRelations,
  walletTransactionRelations,
};
