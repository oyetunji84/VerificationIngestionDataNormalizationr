const { pgTable, uuid, varchar, timestamp } = require("drizzle-orm/pg-core");
const { sql } = require("drizzle-orm");

const companies = pgTable("companies", {
  id: uuid("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull(),
  status: varchar("status", { length: 20 }).notNull().default("ACTIVE"),
  apiKey: varchar("api_key", { length: 128 }),
  apiKeyHash: varchar("api_key_hash", { length: 128 }),
  createdAt: timestamp("created_at")
    .notNull()
    .default(sql`now()`),
  updatedAt: timestamp("updated_at")
    .notNull()
    .default(sql`now()`),
});

module.exports = { companies };
