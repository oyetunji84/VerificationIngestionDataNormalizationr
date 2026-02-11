const { relations } = require('drizzle-orm');
const { companies } = require('./companies');
const { wallets } = require('./wallets');

const { walletTransactions } = require('./walletTransactions');


const companyRelations = relations(companies, ({ one, many }) => ({
  wallet: one(wallets, {
    fields: [companies.id],
    references: [wallets.companyId],
  }),

}));


const walletRelations = relations(wallets, ({ one, many }) => ({
  company: one(companies, {
    fields: [wallets.companyId],
    references: [companies.id],
  }),

  transactions: many(walletTransactions),
}));


const walletTransactionRelations = relations(walletTransactions, ({ one }) => ({

  wallet: one(wallets, {
    fields: [walletTransactions.walletId],
    references: [wallets.id],
  }),
}));

module.exports = {
  companyRelations,
  walletRelations,
  walletTransactionRelations,
};
