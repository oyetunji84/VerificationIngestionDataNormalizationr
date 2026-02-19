const {
  pgTable,
  uuid,
  varchar,
  bigint,
  timestamp,
  integer,
} = require("drizzle-orm/pg-core");
const { sql } = require("drizzle-orm");

const wallets = pgTable("wallets", {
  id: uuid("id").primaryKey().defaultRandom(),
  companyId: uuid("company_id").notNull(),
  currency: varchar("currency", { length: 3 }).notNull().default("NGN"),
  balance: integer("balance").notNull().default(0),
  status: varchar("status", { length: 20 }).notNull().default("ACTIVE"),
  createdAt: timestamp("created_at")
    .notNull()
    .default(sql`now()`),
  updatedAt: timestamp("updated_at")
    .notNull()
    .default(sql`now()`),
});

module.exports = { wallets };
