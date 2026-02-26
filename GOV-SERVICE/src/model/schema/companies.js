const { pgTable, uuid, varchar, timestamp } = require("drizzle-orm/pg-core");
const { sql } = require("drizzle-orm");

const companies = pgTable("companies", {
  id: uuid("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull(),
  status: varchar("status", { length: 20 }).notNull().default("ACTIVE"),
  apiKeyHash: varchar("api_key_hash", { length: 128 }),
  apiKeyPrefix: varchar("api_key_prefix", { length: 32 }),
  apiKeyCreatedAt: timestamp("api_key_created_at"),
  apiKeyLastUsedAt: timestamp("api_key_last_used_at"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
});

module.exports = { companies };

