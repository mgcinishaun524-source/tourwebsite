# Payment Integration — Pesepay Split Payments & Provider Abstraction

## Provider Architecture (`server/payments/`)
- `PaymentProviderAdapter` (`server/payments/types.ts`) isolates gateway implementation from bookings and ledger accounting.
- Primary implementation: `PesepayAdapter` (`server/payments/pesepayAdapter.ts`).
- Alternative relay scaffold: `PayonifyRelayAdapter` (`server/payments/payonifyRelayAdapter.ts`, citing `https://docs.payonify.com/relay`).

## Verified Pesepay Contract
- **Sandbox Base URL**: `https://api.test.sandbox.pesepay.com/payments-engine/v1`
- **Production Base URL**: `https://api.pesepay.com/api/payments-engine/v1` (blocked unless `PESEPAY_ENV=production` **and** `PAYMENT_LIVE_ENABLED=true`)
- **Initiate**: `POST /payments/initiate`
- **Verify Status**: `GET /payments/check-payment?referenceNumber=...`
- **Payload Encryption**: AES-256-CBC using the 32-byte `PESEPAY_INTEGRATION_KEY` / `PESEPAY_ENCRYPTION_KEY` (`PESEPAY_ENCRYPTION_KEY`, IV = first 16 UTF-8 characters of the encryption key), wrapped as `{ "payload": "<base64>" }`.

## Single-Beneficiary Split Constraint
- Once split beneficiary accounts are active on a Pesepay Master Merchant app, Pesepay requires `paymentMetadata: { beneficiaryMerchantEmail }` and allows **one beneficiary merchant per transaction**.
- `POST /api/bookings/prepare-checkout` automatically partitions multi-supplier carts by `(supplierId, currencyCode)` so each supplier booking generates its own verified split transaction and transparent customer breakdown.

## Verification & Refund Safeguards
- Redirects to `/checkout/return` never confirm a booking on their own. Confirmation occurs only after decrypting the callback (`POST /api/payments/pesepay/result`) or polling (`GET /api/payments/:merchantReference/status`) and verifying directly with Pesepay `/payments/check-payment` that `merchantReference`, `amountMinor`, `currencyCode`, and `beneficiaryMerchantEmail` match server records.
- Live split refund execution remains blocked unless `PESEPAY_SPLIT_REFUNDS_VERIFIED=true` after confirming reversal rules with Pesepay.
