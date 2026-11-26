# Database & Migrations — TRANSEND TOURS (PRIVATE) LIMITED

## Migration Files
Apply the SQL migrations in strict order against PostgreSQL / Supabase:
1. `supabase/migrations/001_initial_schema.sql`
2. `supabase/migrations/002_rls_and_security.sql`
3. `supabase/migrations/003_transactional_rpcs.sql`

## Schema Groups
- **Identity & Access**: `profiles`, `roles`, `permissions`, `role_permissions`, `user_roles`, `auth_sessions_audit`
- **Suppliers & Compliance**: `suppliers`, `supplier_documents`, `supplier_verification_records`, `supplier_payment_accounts`, `supplier_beneficiary_arrangements`, `supplier_agreements`
- **Catalogue**: `destinations`, `experience_categories`, `experiences`, `experience_images`, `accommodation`, `accommodation_images`, `transport_services`, `travel_packages`, `package_items`
- **Inventory**: `supplier_availability`, `availability_slots`, `inventory_reservations`
- **Bookings**: `bookings`, `booking_items`, `booking_guests`, `booking_status_history`, `cancellation_requests`
- **Commissions**: `commission_rules`, `supplier_commission_agreements`, `booking_commission_snapshots`
- **Payments**: `payment_providers`, `payments`, `payment_attempts`, `payment_events`, `provider_transactions`, `provider_split_records`
- **Refunds**: `refunds`, `refund_events`
- **Double-Entry Ledger & Reconciliation**: `ledger_accounts`, `ledger_journals`, `ledger_entries`, `gateway_settlement_records`, `supplier_settlement_records`, `reconciliation_runs`, `reconciliation_discrepancies`
- **Customer & Security**: `reviews`, `notifications`, `customer_support_requests`, `saved_experiences`, `audit_logs`, `security_events`, `administrative_actions`

## Financial & Currency Rules
- Every monetary field uses `BIGINT` minor currency units (`*_minor`) alongside an explicit `CHAR(3)` ISO-4217 `currency_code` (`USD`, `ZWG`, etc.).
- `post_balanced_ledger_journal` rejects unbalanced journals (`debits <> credits`), missing currency accounts, or duplicate references.
- All tables enforce Row Level Security (`ALTER TABLE ... ENABLE ROW LEVEL SECURITY`).
