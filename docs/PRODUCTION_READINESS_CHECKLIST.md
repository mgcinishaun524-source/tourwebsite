# Production Readiness Checklist — TRANSEND TOURS (PRIVATE) LIMITED

Before switching `PAYMENT_LIVE_ENABLED=true` or accepting live customer traffic:

1. **Corporate Identity & Legal Filings**
   - [ ] Supply `COMPANY_REGISTRATION_NUMBER`, `COMPANY_TAX_NUMBER`, `COMPANY_REGISTERED_ADDRESS`, `COMPANY_SUPPORT_EMAIL`, and `COMPANY_SUPPORT_PHONE`.
   - [ ] Publish final legal Terms & Conditions, Privacy Policy, and Cancellation Policy reviewed by Zimbabwean legal counsel.

2. **Database & Storage Provisioning**
   - [ ] Create Supabase project and run `001_initial_schema.sql`, `002_rls_and_security.sql`, and `003_transactional_rpcs.sql`.
   - [ ] Verify private `supplier-documents` Storage bucket policies and test non-public document download isolation.
   - [ ] Configure `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `VITE_SUPABASE_URL`, and `VITE_SUPABASE_ANON_KEY`.

3. **Staff RBAC & MFA**
   - [ ] Assign initial `super_admin`, `admin`, `finance`, and `operations` roles in `user_roles`.
   - [ ] Enable `profiles.mfa_enforced = true` and verify TOTP AAL2 step-up for all finance and compliance staff.

4. **Pesepay Marketplace Onboarding**
   - [ ] Complete Pesepay Master Merchant verification for **TRANSEND TOURS (PRIVATE) LIMITED**.
   - [ ] Confirm production `PESEPAY_INTEGRATION_KEY` and 32-character `PESEPAY_ENCRYPTION_KEY`.
   - [ ] Confirm split-payment beneficiary approval workflow and refund/reversal API rules with Pesepay support before setting `PESEPAY_SPLIT_REFUNDS_VERIFIED=true`.
   - [ ] Execute end-to-end sandbox split payment test with `PESEPAY_ENV=sandbox` and verify double-entry ledger balance before cutover.

5. **Commercial Commission Rules**
   - [ ] Replace any development sample rates (`is_development_sample = true`) with formally approved commercial commission agreements (`commission_rules` / `supplier_commission_agreements`).
