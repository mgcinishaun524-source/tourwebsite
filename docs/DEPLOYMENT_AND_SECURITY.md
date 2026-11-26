# Deployment & Security Guide — TRANSEND TOURS (PRIVATE) LIMITED

## Environment Variables
Configure environment variables (see `.env.example` — never commit real keys):
- **Server Database & Auth**: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` (server-only)
- **Browser Auth**: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` (public anon key only)
- **Pesepay Gateway**: `PESEPAY_ENV` (`sandbox` | `production`), `PAYMENT_LIVE_ENABLED` (`false` until cutover), `PESEPAY_INTEGRATION_KEY`, `PESEPAY_ENCRYPTION_KEY` (exact 32 chars), `PESEPAY_RESULT_URL`, `PESEPAY_RETURN_URL`, `PESEPAY_SPLIT_REFUNDS_VERIFIED`
- **Corporate Entity Fields**: `COMPANY_REGISTRATION_NUMBER`, `COMPANY_TAX_NUMBER`, `COMPANY_SUPPORT_EMAIL`, `COMPANY_SUPPORT_PHONE`, `COMPANY_REGISTERED_ADDRESS`

## Build & Start Commands
- Install dependencies: `npm install`
- Run test suite: `npm test`
- Type check: `npm run lint`
- Build frontend bundle: `npm run build`
- Development server (port 3000): `npm run dev`
- Production server (port 3000): `npm start`

## Implemented Security Safeguards
- **Token & Session Hygiene**: Browser auth sessions remain strictly in memory (`src/lib/supabaseClient.ts`), never `localStorage`.
- **RBAC & Step-Up MFA**: All private API routes enforce Supabase JWT verification (`requireAuth`), role verification (`requireRoles`), and AAL2 MFA enforcement (`requireMfaIfEnforced`) on finance/compliance actions.
- **Anti-Tampering & Strict CORS**: Server computes all booking amounts, commissions, and ledger postings independently; `strictCorsMiddleware` restricts cross-origin requests; rate limiters throttle payment/booking endpoints; CSV exports escape formula prefixes (`=`, `+`, `-`, `@`); payment verification mismatches write directly to `security_events`.
