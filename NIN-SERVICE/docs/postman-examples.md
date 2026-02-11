## NIN-SERVICE API examples

### 1. Verify NIN (idempotent)

**Request**

- **Method**: `POST`
- **URL**: `http://localhost:4001/verify/NIN`
- **Headers**:
  - `Content-Type: application/json`
  - `x-api-key: <COMPANY_API_KEY>`
  - `x-idempotency-key: <UNIQUE_REQUEST_ID>` (reuse this value on retries)
- **Body**:

```json
{
  "nin": "12345678901"
}
```

**Notes**

- If you send the **same** `x-idempotency-key` multiple times, the service will:
  - Charge the wallet at most **once**.
  - Return the **same logical result** for each retry.

---

### 2. Fund wallet

**Request**

- **Method**: `POST`
- **URL**: `http://localhost:4001/wallet/fund`
- **Headers**:
  - `Content-Type: application/json`
  - `x-api-key: <COMPANY_API_KEY>`
  - `x-idempotency-key: <UNIQUE_REQUEST_ID_FOR_FUNDING>`
- **Body**:

```json
{
  "amountInNaira": 5000
}
```

The backend will convert this to kobo internally (`5000 * 100`).

---

### 3. Get wallet balance

**Request**

- **Method**: `GET`
- **URL**: `http://localhost:4001/wallet/balance`
- **Headers**:
  - `x-api-key: <COMPANY_API_KEY>`

**Response shape (example)**

```json
{
  "success": true,
  "balance": {
    "balance": 750000,
    "balanceInNaira": 7500,
    "currency": "NGN",
    "walletId": "....",
    "companyId": "...."
  }
}
```

---

### 4. Get wallet transaction history

**Request**

- **Method**: `GET`
- **URL**: `http://localhost:4001/wallet/transactions?limit=10&offset=0`
- **Headers**:
  - `x-api-key: <COMPANY_API_KEY>`

**Query params**

- `limit` (optional, default 20, max 100) – number of transactions.
- `offset` (optional, default 0) – pagination offset.

---

### 5. Test scenarios

1. **Same `x-idempotency-key` retried many times for NIN verification**
   - Use the same header value and body.
   - Expected: only one debit in `wallet_transactions`; all responses consistent.

2. **NIN found**
   - Use a `nin` that exists in your seeded Mongo `NinModel` collection.
   - Expected:
     - Wallet debited by `COST_IN_KOBO`.
     - `nin_requests.status = 'SUCCESS'`.

3. **NIN not found**
   - Use a `nin` not present in `NinModel`.
   - Expected:
     - Wallet initially debited, then **refunded**.
     - `nin_requests.status = 'FAILED'`, `errorCode = 'NIN_NOT_FOUND'`.

4. **Insufficient funds**
   - Use a company wallet with balance less than `COST_IN_KOBO`.
   - Call `/verify/NIN`.
   - Expected:
     - HTTP error with `InsufficientFundsError`.
     - No new `wallet_transactions` row created.

