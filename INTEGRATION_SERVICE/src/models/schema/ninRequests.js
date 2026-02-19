const {
  pgTable,
  uuid,
  varchar,
  integer,
  timestamp,
} = require("drizzle-orm/pg-core");
const { sql } = require("drizzle-orm");

const ninRequests = pgTable("nin_requests", {
  id: uuid("id").primaryKey().defaultRandom(),
  requestId: varchar("request_id", { length: 255 }).notNull(),
  companyId: varchar("company_id").notNull(),
  ninNumber: varchar("nin_number", { length: 20 }).notNull(),
  status: varchar("status", { length: 20 }).notNull(), // e.g. PENDING, SUCCESS, FAILED
  walletTransactionId: uuid("wallet_transaction_id").notNull(),
  charged: varchar("charged", { length: 5 }).notNull().default("true"),
  amountCharged: integer("amount_charged").notNull(),
  errorMessage: varchar("error_message", { length: 255 }),
  errorCode: varchar("error_code", { length: 100 }),
  createdAt: timestamp("created_at")
    .notNull()
    .default(sql`now()`),
  updatedAt: timestamp("updated_at")
    .notNull()
    .default(sql`now()`),
});

module.exports = { ninRequests };
