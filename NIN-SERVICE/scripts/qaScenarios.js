// Node 18+ required for global fetch.
// This script exercises the main flows of NIN-SERVICE like a QA tester.

const { v4: uuidv4 } = require("uuid");

const BASE_URL = process.env.NIN_BASE_URL || "http://localhost:3002";

// Hardcoded dev API keys from seeded data
// 1 -> Acme Payments (high balance)
// 2 -> YouVerify Test Co (currently unused in this script)
// 3 -> Low Balance Corp (very low balance)
const ACME_API_KEY = "7627938fee074b7985ab21ee02ae1feb";
const YOUVERIFY_API_KEY = "46219cc9240a4884806d8a18e59d2ac2";
const LOW_BAL_API_KEY = "b9f95c5f35124918838158b3c3db6a9b";

// Set NINs according to your seeded Mongo data:
const EXISTING_NIN = process.env.EXISTING_NIN || "12345678901"; // should exist
const NON_EXISTING_NIN =
  process.env.NON_EXISTING_NIN || "99999999999"; // should NOT exist

async function makeRequest(path, { method = "GET", headers = {}, body } = {}) {
  const url = `${BASE_URL}${path}`;

  const options = {
    method,
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
  };

  if (body && method !== "GET") {
    options.body = JSON.stringify(body);
  }

  const res = await fetch(url, options);
  let json = null;
  try {
    json = await res.json();
  } catch {
    json = null;
  }

  return { status: res.status, json };
}

async function scenarioFundWalletIdempotent() {
  console.log("\n=== Scenario 1: Fund wallet (idempotent) ===");

  const idempotencyKey = uuidv4();

  const body = { amountInNaira: 0 }; // ₦5,000

  const first = await makeRequest("/wallet/fund", {
    method: "POST",
    headers: {
      "x-api-key": ACME_API_KEY,
      "x-idempotency-key": idempotencyKey,
    },
    body,
  });

  console.log("First fund response:", first.status, first.json);

  const second = await makeRequest("/wallet/fund", {
    method: "POST",
    headers: {
      "x-api-key": ACME_API_KEY,
      "x-idempotency-key": idempotencyKey,
    },
    body,
  });

  console.log("Second (idempotent) fund response:", second.status, second.json);
}

async function scenarioGetBalance() {
  console.log("\n=== Scenario 2: Get wallet balance ===");

  const res = await makeRequest("/wallet/balance", {
    headers: { "x-api-key": ACME_API_KEY },
  });

  console.log("Balance response:", res.status, res.json);
}

async function scenarioVerifyNINSuccess() {
  console.log("\n=== Scenario 3: Verify NIN (success) ===");

  const idempotencyKey = uuidv4();

  const res = await makeRequest("/verify/NIN", {
    method: "POST",
    headers: {
      "x-api-key": ACME_API_KEY,
      "x-idempotency-key": idempotencyKey,
    },
    body: { nin: EXISTING_NIN },
  });

  console.log("Verify NIN (success) response:", res.status, res.json);
}

async function scenarioVerifyNINNotFound() {
  console.log("\n=== Scenario 4: Verify NIN (not found, refund) ===");

  const idempotencyKey = uuidv4();

  const res = await makeRequest("/verify/NIN", {
    method: "POST",
    headers: {
      "x-api-key": ACME_API_KEY,
      "x-idempotency-key": idempotencyKey,
    },
    body: { nin: NON_EXISTING_NIN },
  });

  console.log("Verify NIN (not found) response:", res.status, res.json);
}

async function scenarioVerifyNINInsufficientFunds() {
  console.log("\n=== Scenario 5: Verify NIN (insufficient funds) ===");

  const idempotencyKey = uuidv4();

  const res = await makeRequest("/verify/NIN", {
    method: "POST",
    headers: {
      "x-api-key": LOW_BAL_API_KEY,
      "x-idempotency-key": idempotencyKey,
    },
    body: { nin: EXISTING_NIN },
  });

  console.log("Verify NIN (insufficient funds) response:", res.status, res.json);
}

async function scenarioWalletHistory() {
  console.log("\n=== Scenario 6: Wallet transaction history ===");

  const res = await makeRequest("/wallet/transactions?limit=20&offset=0", {
    headers: { "x-api-key": ACME_API_KEY },
  });

  console.log("Wallet history response:", res.status);
  console.log(
    "First few transactions:",
    Array.isArray(res.json?.transactions)
      ? res.json.transactions.slice(0, 5)
      : res.json,
  );
}

async function main() {
  console.log("[QA] Running NIN-SERVICE scenarios against:", BASE_URL);

  await scenarioFundWalletIdempotent();
  await scenarioGetBalance();
  await scenarioVerifyNINSuccess();
  await scenarioVerifyNINNotFound();
  await scenarioVerifyNINInsufficientFunds();
  await scenarioWalletHistory();

  console.log("\n[QA] All scenarios completed.");
}

main().catch((err) => {
  console.error("[QA] Error running scenarios:", err);
  process.exit(1);
});

