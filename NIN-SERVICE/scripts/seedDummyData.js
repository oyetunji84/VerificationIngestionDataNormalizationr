const { v4: uuidv4 } = require("uuid");
const { db } = require("../src/infra/postgresDb");
const { companies, wallets } = require("../src/model/schema/t");
const { hashApiKey } = require("../src/middleware/apiKeyAuth");

async function seed() {
  console.log("[SEED] Starting dummy data seeding...");

  // WARNING: This will wipe existing companies and wallets.
  // Use only in development.
  await db.delete(wallets);
  await db.delete(companies);

  const now = new Date();

  // Pre-generate raw API keys for each company
  const rawKeys = {
    acme: `${uuidv4().replace(/-/g, "")}`,
    youverify: `${uuidv4().replace(/-/g, "")}`,
    lowBalance: `${uuidv4().replace(/-/g, "")}`,
  };

  const companyData = [
    {
      id: uuidv4(),
      name: "Acme Payments",
      email: "acme@example.com",
      status: "ACTIVE",
      apiKeyHash: hashApiKey(rawKeys.acme),
      apiKeyPrefix: rawKeys.acme.slice(0, 8),
      apiKeyCreatedAt: now,
      apiKeyLastUsedAt: null,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: uuidv4(),
      name: "YouVerify Test Co",
      email: "youverify@example.com",
      status: "ACTIVE",
      apiKeyHash: hashApiKey(rawKeys.youverify),
      apiKeyPrefix: rawKeys.youverify.slice(0, 8),
      apiKeyCreatedAt: now,
      apiKeyLastUsedAt: null,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: uuidv4(),
      name: "Low Balance Corp",
      email: "low-balance@example.com",
      status: "ACTIVE",
      apiKeyHash: hashApiKey(rawKeys.lowBalance),
      apiKeyPrefix: rawKeys.lowBalance.slice(0, 8),
      apiKeyCreatedAt: now,
      apiKeyLastUsedAt: null,
      createdAt: now,
      updatedAt: now,
    },
  ];

  await db.insert(companies).values(companyData);

  const walletData = companyData.map((company, index) => {
    let balanceInKobo;

    if (index === 0) {
      // Acme Payments: ₦100,000
      balanceInKobo = 100_000 * 100;
    } else if (index === 1) {
      // YouVerify Test Co: ₦50,000
      balanceInKobo = 50_000 * 100;
    } else {
      // Low Balance Corp: ₦10 (to trigger insufficient funds easily)
      balanceInKobo = 10 * 100;
    }

    return {
      id: uuidv4(),
      companyId: company.id,
      currency: "NGN",
      balance: balanceInKobo,
      status: "ACTIVE",
      createdAt: now,
      updatedAt: now,
    };
  });

  await db.insert(wallets).values(walletData);

  console.log("[SEED] Seeded companies:");
  companyData.forEach((c) => {
    let rawKey;
    if (c.email === "acme@example.com") {
      rawKey = rawKeys.acme;
    } else if (c.email === "youverify@example.com") {
      rawKey = rawKeys.youverify;
    } else if (c.email === "low-balance@example.com") {
      rawKey = rawKeys.lowBalance;
    }

    console.log(`  - ${c.name} (${c.email}) => id=${c.id}`);
    console.log(`      apiKeyPrefix=${c.apiKeyPrefix}`);
    console.log(`      rawApiKey=${rawKey}`);
  });

  console.log("[SEED] Seeded wallets:");
  walletData.forEach((w) => {
    console.log(
      `  - walletId=${w.id}, companyId=${w.companyId}, balanceInNaira=${
        w.balance / 100
      }`,
    );
  });

  console.log("[SEED] Done.");
}

seed()
  .then(() => {
    process.exit(0);
  })
  .catch((err) => {
    console.error("[SEED] Failed:", err);
    process.exit(1);
  });

