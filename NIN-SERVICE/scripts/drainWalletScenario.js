// Node 18+ required for global fetch.
// This script keeps sending NIN verification requests back-to-back
// until the wallet for a given company runs out of money
// (i.e., we hit InsufficientFundsError or a non-2xx status).

const { v4: uuidv4 } = require("uuid");

const BASE_URL = process.env.NIN_BASE_URL || "http://localhost:3002";

// API key for the company you want to drain.
// You can override via env: DRAIN_API_KEY
const DRAIN_API_KEY =
  process.env.DRAIN_API_KEY || "7627938fee074b7985ab21ee02ae1feb"; // Acme Payments by default

// NIN that exists in your seeded Mongo data
const EXISTING_NIN = process.env.EXISTING_NIN || "12345678901";

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

async function getBalance() {
  const res = await makeRequest("/wallet/balance", {
    headers: { "x-api-key": DRAIN_API_KEY },
  });
  return res;
}

async function drainWalletWithNIN() {
  console.log("[DRAIN] Starting drain scenario against:", BASE_URL);

  if (!DRAIN_API_KEY || DRAIN_API_KEY === "REPLACE_WITH_API_KEY") {
    console.error(
      "[DRAIN] Please set DRAIN_API_KEY env or hardcode a valid API key in this script.",
    );
    process.exit(1);
  }

  let balanceRes = await getBalance();
  console.log("[DRAIN] Initial balance response:", balanceRes.status, balanceRes.json);

  let iteration = 0;

  // Loop until we hit insufficient funds or some non-2xx response
  // or until a max iteration cap to avoid infinite loops in case of bugs.
  const MAX_ITERATIONS = 1000;

  while (iteration < MAX_ITERATIONS) {
    iteration += 1;

    const idempotencyKey = uuidv4();

    console.log(
      `\n[DRAIN] Iteration ${iteration} - sending /verify/NIN with idempotencyKey=${idempotencyKey}`,
    );

    const res = await makeRequest("/verify/NIN", {
      method: "POST",
      headers: {
        "x-api-key": DRAIN_API_KEY,
        "x-idempotency-key": idempotencyKey,
      },
      body: { nin: EXISTING_NIN },
    });

    console.log("[DRAIN] Response:", res.status, res.json);

    if (res.status >= 400) {
      console.log(
        "[DRAIN] Stopping because we hit a non-2xx status (likely insufficient funds or error).",
      );
      break;
    }

    // Refresh balance every few iterations to see progress
    if (iteration % 5 === 0) {
      balanceRes = await getBalance();
      console.log(
        "[DRAIN] Balance checkpoint:",
        balanceRes.status,
        balanceRes.json,
      );
    }
  }

  console.log("[DRAIN] Finished drain scenario after iterations:", iteration);
}

drainWalletWithNIN().catch((err) => {
  console.error("[DRAIN] Error running drain scenario:", err);
  process.exit(1);
});

