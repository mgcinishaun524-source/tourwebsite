# Architecture — TRANSEND TOURS (PRIVATE) LIMITED

## Overview
- **Legal Entity**: TRANSEND TOURS (PRIVATE) LIMITED
- **Public Brand**: Transend Tours
- **Runtime**: Full-stack TypeScript web application powered by **React + Vite** on the client and **Node.js + Express (`server.ts`)** on the backend, serving on port `3000`.
- **Database & Auth**: Normalized PostgreSQL relational schema (`supabase/migrations/001_initial_schema.sql` through `003_transactional_rpcs.sql`) integrated through `@supabase/supabase-js` with Row Level Security (RLS), private storage buckets for supplier KYC documents, and server-side Bearer JWT + RBAC verification.

## Domain Boundaries
1. **Editorial Destination Showcase (Client)**:
   - Preserves the high-fashion Transend Tours editorial experience (`GreatFallsChapter`, `ZambeziHorizontalChapter`, `IntoTheWildSplitChapter`, `ExperienceDiscoveryShowcase`, `AccommodationLookbook`) with 12 local photographic plates under `src/assets/images/`.
   - Uses `Transend Tours` for public brand headers while keeping all unconfigured corporate filings (company registration number, tax number, registered address, telephone, email) explicitly marked pending confirmation.
2. **Marketplace Auth & RBAC (`server/middleware/auth.ts`, `src/pages/AuthPage.tsx`)**:
   - In-memory Supabase Auth session storage on client (no tokens persisted in `localStorage`).
   - Server resolves roles from `user_roles -> roles`: `customer`, `supplier`, `operations`, `content_manager`, `finance`, `admin`, `super_admin`.
   - Enforces TOTP MFA (`aal2`) when `profiles.mfa_enforced = true` on privileged routes (`admin/suppliers/:id/verify`, `admin/commission-rules`, `admin/reconcile`, `refunds/:id/transition`).
3. **Supplier Governance (`server/routes/suppliers.ts`, `src/pages/SupplierPortalPage.tsx`)**:
   - Suppliers onboard with legal/tax fields, private signed-URL KYC uploads (`supplier-documents` bucket), explicit supplier agreement acceptance, and Pesepay merchant payout email.
   - Paid split-payment bookings remain strictly gated behind `verification_status = 'approved'`, `can_accept_paid_bookings = true`, and an `active` beneficiary arrangement.
4. **Concurrency-Safe Inventory & Commission Engine (`server/routes/bookings.ts`, `server/services/commission.ts`)**:
   - `reserve_inventory_slot` executes `SELECT ... FOR UPDATE` inside PostgreSQL to eliminate double-booking race conditions and supports idempotency keys.
   - Prices and basis-point commissions (`rate_bps`) are calculated exclusively server-side in integer minor currency units using `BigInt`.
5. **Double-Entry Ledger (`server/services/ledger.ts`, `supabase/migrations/003_transactional_rpcs.sql`)**:
   - Every confirmed payment and refund posts balanced immutable `ledger_journals` + `ledger_entries` (`SUM(debit) === SUM(credit)` within a single ISO-4217 currency).
