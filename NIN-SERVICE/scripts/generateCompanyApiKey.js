const crypto = require("crypto");
const { eq } = require("drizzle-orm");
const { db } = require("../src/infra/postgresDb");
const { companies } = require("../src/model/schema/companies");
const { hashApiKey } = require("../src/middleware/apiKeyAuth");

const generateRawApiKey = () => {
  const random = crypto.randomBytes(32).toString("base64url");
  return `nin_live_${random}`;
};

const run = async () => {
  const identifier = process.argv[2];

  if (!identifier) {
    console.error(
      "Usage: node scripts/generateCompanyApiKey.js <company-email-or-id>",
    );
    process.exit(1);
  }

  const isUuid = /^[0-9a-fA-F-]{36}$/.test(identifier)

  const query = db
    .select()
    .from(companies)
    .where(isUuid ? eq(companies.id, identifier) : eq(companies.email, identifier))
    .limit(1);

  const [company] = await query;

  if (!company) {
    console.error("Company not found for identifier:", identifier);
    process.exit(1);
  }

  const rawApiKey = generateRawApiKey();
  const apiKeyHash = hashApiKey(rawApiKey);
  const apiKeyPrefix = rawApiKey.slice(0, 8);

  await db
    .update(companies)
    .set({
      apiKeyHash,
      apiKeyPrefix,
      apiKeyCreatedAt: new Date(),
      apiKeyLastUsedAt: null,
      updatedAt: new Date(),
    })
    .where(eq(companies.id, company.id));

  console.log("API key generated for company:");
  console.log("  id:    ", company.id);
  console.log("  email: ", company.email);
  console.log("");
  console.log(
    "API key (store this securely; it will not be shown again in logs):",
  );
  console.log(rawApiKey);
  process.exit(0);
};

run().catch((err) => {
  console.error("Failed to generate API key:", err);
  process.exit(1);
});

