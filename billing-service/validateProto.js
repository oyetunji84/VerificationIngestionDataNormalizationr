#!/usr/bin/env node
"use strict";

/**
 * scripts/validate-proto.js
 *
 * Validates that billing.proto loads correctly and all 6 expected RPCs
 * are present with the correct request/response types.
 *
 * Usage:
 *   node scripts/validate-proto.js
 *
 * Exit codes:
 *   0 — all checks passed
 *   1 — one or more checks failed
 */

const path = require("path");
const grpc = require("@grpc/grpc-js");
const protoLoader = require("@grpc/proto-loader");

// ── Config ────────────────────────────────────────────────────────────────────

const PROTO_PATH = path.resolve(
  __dirname,
  "../billing-service/src/proto/billing/v1/billing.proto",
);

const LOADER_OPTIONS = {
  keepCase: true,
  longs: String, // int64 → string (safe for Node)
  enums: String, // enum values as strings
  defaults: true,
  oneofs: true,
};

// Each entry: [rpcName, expectedRequestType, expectedResponseType]
const EXPECTED_RPCS = [
  ["FindOrCreateWallet", "FindOrCreateWalletRequest", "WalletResponse"],
  ["GetBalance", "GetBalanceRequest", "WalletResponse"],
  ["ChargeWallet", "ChargeWalletRequest", "TransactionResponse"],
  ["FundWallet", "FundWalletRequest", "TransactionResponse"],
  ["RefundWallet", "RefundWalletRequest", "TransactionResponse"],
  ["GetTransactions", "GetTransactionsRequest", "GetTransactionsResponse"],
];

// ── Helpers ───────────────────────────────────────────────────────────────────

const GREEN = (s) => `\x1b[32m${s}\x1b[0m`;
const RED = (s) => `\x1b[31m${s}\x1b[0m`;
const YELLOW = (s) => `\x1b[33m${s}\x1b[0m`;
const BOLD = (s) => `\x1b[1m${s}\x1b[0m`;

let passed = 0;
let failed = 0;

function ok(label) {
  console.log(`  ${GREEN("✓")} ${label}`);
  passed++;
}

function fail(label, detail = "") {
  console.log(
    `  ${RED("✗")} ${label}${detail ? `\n      ${RED(detail)}` : ""}`,
  );
  failed++;
}

function section(title) {
  console.log(`\n${BOLD(title)}`);
}

// ── Main ──────────────────────────────────────────────────────────────────────

function validate() {
  console.log(BOLD("\n=== IBKVerify Billing Proto Validator ==="));
  console.log(`Proto path: ${YELLOW(PROTO_PATH)}\n`);

  // ── 1. Load the proto ──────────────────────────────────────────────────────
  section("1. Loading proto file");

  let packageDefinition;
  try {
    packageDefinition = protoLoader.loadSync(PROTO_PATH, LOADER_OPTIONS);
    ok("protoLoader.loadSync() succeeded");
  } catch (err) {
    fail("protoLoader.loadSync() threw an error", err.message);
    console.log(`\n${RED("Proto failed to load — aborting.")}`);
    process.exit(1);
  }

  // ── 2. Load package definition ────────────────────────────────────────────
  section("2. Loading package definition");

  let proto;
  try {
    proto = grpc.loadPackageDefinition(packageDefinition);
    ok("grpc.loadPackageDefinition() succeeded");
  } catch (err) {
    fail("grpc.loadPackageDefinition() threw an error", err.message);
    process.exit(1);
  }

  // ── 3. Check package path billing.v1.BillingService ──────────────────────
  section("3. Checking package structure (billing.v1.BillingService)");

  if (!proto.billing) {
    fail("proto.billing namespace not found");
    process.exit(1);
  }
  ok("proto.billing namespace exists");

  if (!proto.billing.v1) {
    fail(
      "proto.billing.v1 namespace not found — check `package billing.v1;` in proto",
    );
    process.exit(1);
  }
  ok("proto.billing.v1 namespace exists");

  if (!proto.billing.v1.BillingService) {
    fail("proto.billing.v1.BillingService not found");
    process.exit(1);
  }
  ok("proto.billing.v1.BillingService exists");

  const serviceDefinition = proto.billing.v1.BillingService.service;
  if (!serviceDefinition) {
    fail(
      "BillingService.service is undefined — proto may not have loaded correctly",
    );
    process.exit(1);
  }
  ok("BillingService.service definition is accessible");

  // ── 4. Validate all 6 RPCs ────────────────────────────────────────────────
  section("4. Validating RPCs");

  const actualRpcNames = Object.keys(serviceDefinition);
  console.log(
    `  Found ${YELLOW(actualRpcNames.length)} RPC(s): ${actualRpcNames.join(", ")}\n`,
  );

  for (const [rpcName, expectedReq, expectedRes] of EXPECTED_RPCS) {
    const rpc = serviceDefinition[rpcName];

    if (!rpc) {
      fail(`${rpcName} — RPC not found`);
      continue;
    }

    // Extract short type name from the full path (e.g. "billing.v1.ChargeWalletRequest")
    const actualReq =
      rpc.requestType?.type?.name ?? rpc.requestType?.name ?? "(unknown)";
    const actualRes =
      rpc.responseType?.type?.name ?? rpc.responseType?.name ?? "(unknown)";

    const reqOk = actualReq === expectedReq;
    const resOk = actualRes === expectedRes;

    if (reqOk && resOk) {
      ok(`${rpcName}  (${expectedReq} → ${expectedRes})`);
    } else {
      if (!reqOk)
        fail(
          `${rpcName} — request type mismatch`,
          `expected ${expectedReq}, got ${actualReq}`,
        );
      if (!resOk)
        fail(
          `${rpcName} — response type mismatch`,
          `expected ${expectedRes}, got ${actualRes}`,
        );
    }
  }

  // ── 5. Check for unexpected extra RPCs ───────────────────────────────────
  section("5. Checking for unexpected RPCs");

  const expectedNames = new Set(EXPECTED_RPCS.map(([name]) => name));
  const unexpected = actualRpcNames.filter((n) => !expectedNames.has(n));

  if (unexpected.length === 0) {
    ok("No unexpected RPCs found");
  } else {
    // Warn but don't fail — extra RPCs are not necessarily wrong
    console.log(
      `  ${YELLOW("⚠")}  Unexpected RPC(s) found: ${unexpected.join(", ")}`,
    );
  }

  // ── 6. Print raw service shape ────────────────────────────────────────────
  section("6. Raw service shape (for reference)");

  for (const [rpcName, rpc] of Object.entries(serviceDefinition)) {
    const req = rpc.requestType?.type?.name ?? rpc.requestType?.name ?? "?";
    const res = rpc.responseType?.type?.name ?? rpc.responseType?.name ?? "?";
    const clientStream = rpc.requestStream ? "stream " : "";
    const serverStream = rpc.responseStream ? "stream " : "";
    console.log(`  ${YELLOW(rpcName)}`);
    console.log(`    request:  ${clientStream}${req}`);
    console.log(`    response: ${serverStream}${res}`);
  }

  // ── Summary ───────────────────────────────────────────────────────────────
  console.log(`\n${BOLD("═".repeat(42))}`);
  console.log(
    `  ${GREEN(`${passed} passed`)}  ${failed > 0 ? RED(`${failed} failed`) : "0 failed"}`,
  );
  console.log(BOLD("═".repeat(42)));

  if (failed > 0) {
    console.log(
      `\n${RED("Proto validation FAILED. Fix the issues above before proceeding to Step 4.")}\n`,
    );
    process.exit(1);
  } else {
    console.log(
      `\n${GREEN("Proto validation PASSED. Safe to proceed to Step 4.")}\n`,
    );
    process.exit(0);
  }
}

validate();
