# Transend Tours

**Legal Entity:** TRANSEND TOURS (PRIVATE) LIMITED  
**Public Brand:** Transend Tours

A full-stack luxury travel editorial platform and multi-supplier booking marketplace for Zambezi, Hwange, Mana Pools, and regional savannah expeditions. Built with **React + Vite**, **TypeScript**, **Tailwind CSS**, **GSAP + Lenis**, **Express**, and **PostgreSQL / Supabase**.

---

## Key Capabilities

- **Editorial Destination Showcase**: Multi-chapter cinematic showcase (`GreatFallsChapter`, `ZambeziHorizontalChapter`, `IntoTheWildSplitChapter`, interactive Chapter 05 experience carousel with exit transition, and `AccommodationLookbook`) backed by curated local photography.
- **Marketplace & Booking Engine**: Multi-category catalogue covering guided tours, helicopter flights, river cruises, safari adventures, luxury accommodation, private transfers, and curated travel packages.
- **Concurrency-Safe Inventory & Checkout**: PostgreSQL row-level locking (`reserve_inventory_slot`), idempotent checkout preparation, multi-supplier cart splitting by `(supplierId, currencyCode)`, and server-side BigInt minor-unit commission calculations.
- **Pesepay Split-Payment Architecture**: AES-256-CBC encrypted Pesepay integration (`server/payments/pesepayAdapter.ts`) with independent server verification, sandbox safety gates (`PAYMENT_LIVE_ENABLED`, `PESEPAY_ENV`), and provider abstraction (`PayonifyRelayAdapter` scaffold).
- **Supplier, Customer & Admin Portals**: Role-based access control (`customer`, `supplier`, `operations`, `content_manager`, `finance`, `admin`, `super_admin`), TOTP AAL2 step-up MFA checks, private KYC document storage, refund state workflows, and immutable double-entry ledger postings.

---

## Tech Stack

- **Frontend**: React 19, React Router 7, TypeScript, Tailwind CSS v4, GSAP (ScrollTrigger + Flip), Lenis smooth scrolling, Lucide Icons
- **Backend**: Node.js, Express, Zod validation, tsx
- **Database & Auth**: PostgreSQL (`supabase/migrations/`), Supabase Auth & Storage
- **Testing & Tooling**: Vite 8 (route lazy-loading + vendor chunk splitting), Vitest, TypeScript (`tsc --noEmit`)

---

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env` and fill in your Supabase, Pesepay, and company registration details:

```bash
cp .env.example .env
```

Key environment groups:
- `APP_URL` — Public base URL (defaults to `http://localhost:3000`)
- `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
- `PAYMENT_LIVE_ENABLED`, `PESEPAY_ENV`, `PESEPAY_INTEGRATION_KEY`, `PESEPAY_ENCRYPTION_KEY`, `PESEPAY_RESULT_URL`, `PESEPAY_RETURN_URL`
- `COMPANY_REGISTRATION_NUMBER`, `COMPANY_TAX_NUMBER`, `COMPANY_SUPPORT_EMAIL`, `COMPANY_SUPPORT_PHONE`, `COMPANY_REGISTERED_ADDRESS`

### 3. Apply Database Migrations

Run the PostgreSQL migrations in strict numerical order:

1. `supabase/migrations/001_initial_schema.sql`
2. `supabase/migrations/002_rls_and_security.sql`
3. `supabase/migrations/003_transactional_rpcs.sql`

### 4. Run Development or Production Server

```bash
# Development server (Express + Vite middleware on port 3000)
npm run dev

# Production build & start
npm run build
npm start
```

---

## Available Scripts

| Script | Description |
| --- | --- |
| `npm run dev` | Starts the Express + Vite development server on port `3000` |
| `npm run build` | Builds the optimized client bundle into `dist/` |
| `npm start` | Starts the production Node/Express server (`node server.ts`) |
| `npm run lint` | Runs strict TypeScript checks (`tsc --noEmit`) |
| `npm test` | Executes the Vitest test suite (`tests/marketplace.test.ts`) |

---

## Project Structure

```text
├── docs/                       # Architecture, DB, security, payment, and readiness guides
├── public/                     # Static public assets
├── server/                     # Express middleware, API routes, payment adapters & services
├── src/
│   ├── assets/images/          # High-resolution photography plates
│   ├── components/             # Modular UI, layout, and editorial home chapters
│   ├── config/                 # Brand and legal configuration
│   ├── context/                # Auth and booking cart providers
│   ├── data/                   # Typed editorial & destination catalogue data
│   ├── motion/                 # GSAP registration, scroll choreographies, route curtains
│   └── pages/                  # Lazy-loaded route pages & portals
├── supabase/migrations/        # PostgreSQL schema, RLS policies, and transactional RPCs
├── tests/                      # Automated unit and marketplace tests
├── server.ts                   # Full-stack Express entrypoint
└── vite.config.ts              # Vite build and manual vendor chunk configuration
```

---

## Additional Documentation

- [Architecture Overview](docs/ARCHITECTURE.md)
- [Database & Migrations](docs/DATABASE.md)
- [Payment Integration](docs/PAYMENT_INTEGRATION.md)
- [Deployment & Security](docs/DEPLOYMENT_AND_SECURITY.md)
- [Production Readiness Checklist](docs/PRODUCTION_READINESS_CHECKLIST.md)
