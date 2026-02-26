const { pgTable, uuid, varchar, bigint, timestamp, integer } = require("drizzle-orm/pg-core");
const { sql } = require("drizzle-orm");

const walletTransactions = pgTable("wallet_transactions", {
  id: uuid("id").primaryKey().defaultRandom(),
  walletId: uuid("wallet_id").notNull(),
  requestId: uuid("request_id"),
  type: varchar("type", { length: 10 }),
  balanceBefore: integer("balance_before"),
  balanceAfter: integer("balance_after"),
  amount: integer("amount").notNull(),
  reference: varchar("reference", { length: 100 }),
  status: varchar("status", { length: 20 }),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

module.exports = { walletTransactions };

