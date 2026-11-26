-- ============================================================================
-- TRANSEND TOURS (PRIVATE) LIMITED
-- Migration 001: Normalized PostgreSQL Marketplace, Ledger, Payment & Security Schema
-- Money convention: ALL monetary amounts stored as BIGINT integer minor units
-- (e.g. cents) alongside explicit ISO-4217 currency_code. Zero floating-point math.
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Shared updated_at trigger function
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- ============================================================================
-- 1. IDENTITY AND ACCESS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL DEFAULT '',
  phone TEXT,
  country TEXT,
  mfa_enforced BOOLEAN NOT NULL DEFAULT FALSE,
  account_status TEXT NOT NULL DEFAULT 'active'
    CHECK (account_status IN ('active', 'suspended', 'pending_verification', 'deactivated')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE
    CHECK (code IN ('customer', 'supplier', 'operations', 'content_manager', 'finance', 'admin', 'super_admin')),
  name TEXT NOT NULL,
  description TEXT,
  requires_mfa BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  module TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.role_permissions (
  role_id UUID NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES public.permissions(id) ON DELETE CASCADE,
  PRIMARY KEY (role_id, permission_id)
);

CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role_id UUID NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
  assigned_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, role_id)
);

CREATE TABLE IF NOT EXISTS public.auth_sessions_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  aal_level TEXT,
  ip_address INET,
  user_agent TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 2. SUPPLIERS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  legal_name TEXT NOT NULL,
  trading_name TEXT NOT NULL,
  registration_number TEXT,
  tax_identification_number TEXT,
  business_email TEXT NOT NULL,
  business_phone TEXT NOT NULL,
  physical_address TEXT,
  country_code CHAR(2) NOT NULL DEFAULT 'ZW',
  verification_status TEXT NOT NULL DEFAULT 'draft'
    CHECK (verification_status IN ('draft', 'submitted', 'under_review', 'additional_info_required', 'approved', 'rejected', 'suspended')),
  can_accept_paid_bookings BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.supplier_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id UUID NOT NULL REFERENCES public.suppliers(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL
    CHECK (document_type IN ('certificate_of_incorporation', 'tourism_authority_licence', 'tax_clearance', 'director_id', 'bank_confirmation', 'insurance_certificate', 'other')),
  storage_bucket TEXT NOT NULL DEFAULT 'supplier-documents',
  storage_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  file_size_bytes BIGINT NOT NULL CHECK (file_size_bytes > 0),
  review_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (review_status IN ('pending', 'verified', 'rejected')),
  uploaded_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.supplier_verification_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id UUID NOT NULL REFERENCES public.suppliers(id) ON DELETE CASCADE,
  previous_status TEXT NOT NULL,
  new_status TEXT NOT NULL
    CHECK (new_status IN ('draft', 'submitted', 'under_review', 'additional_info_required', 'approved', 'rejected', 'suspended')),
  reviewed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.supplier_payment_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id UUID NOT NULL REFERENCES public.suppliers(id) ON DELETE CASCADE,
  provider_code TEXT NOT NULL DEFAULT 'pesepay',
  merchant_email TEXT NOT NULL,
  merchant_reference_code TEXT,
  settlement_currency CHAR(3) NOT NULL DEFAULT 'USD',
  payout_eligibility_verified BOOLEAN NOT NULL DEFAULT FALSE,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'verified', 'rejected', 'suspended')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (supplier_id, provider_code, settlement_currency)
);

CREATE TABLE IF NOT EXISTS public.supplier_beneficiary_arrangements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id UUID NOT NULL REFERENCES public.suppliers(id) ON DELETE CASCADE,
  payment_account_id UUID NOT NULL REFERENCES public.supplier_payment_accounts(id) ON DELETE CASCADE,
  provider_code TEXT NOT NULL DEFAULT 'pesepay',
  provider_beneficiary_id TEXT,
  beneficiary_email TEXT NOT NULL,
  master_commission_bps INTEGER NOT NULL CHECK (master_commission_bps >= 0 AND master_commission_bps <= 10000),
  arrangement_status TEXT NOT NULL DEFAULT 'pending_provider_approval'
    CHECK (arrangement_status IN ('pending_provider_approval', 'active', 'suspended', 'revoked')),
  approved_at TIMESTAMPTZ,
  approved_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.supplier_agreements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id UUID NOT NULL REFERENCES public.suppliers(id) ON DELETE CASCADE,
  agreement_version TEXT NOT NULL,
  legal_entity_name TEXT NOT NULL DEFAULT 'TRANSEND TOURS (PRIVATE) LIMITED',
  accepted_by_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  accepted_ip INET,
  accepted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (supplier_id, agreement_version)
);

-- ============================================================================
-- 3. MARKETPLACE CATALOGUE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.destinations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  region_tag TEXT NOT NULL,
  short_intro TEXT NOT NULL,
  overview TEXT NOT NULL,
  hero_image_url TEXT NOT NULL,
  hero_image_alt TEXT NOT NULL,
  best_time_note TEXT,
  publication_status TEXT NOT NULL DEFAULT 'published'
    CHECK (publication_status IN ('draft', 'published', 'archived')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.experience_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.experiences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id UUID NOT NULL REFERENCES public.suppliers(id) ON DELETE RESTRICT,
  destination_id UUID NOT NULL REFERENCES public.destinations(id) ON DELETE RESTRICT,
  category_id UUID NOT NULL REFERENCES public.experience_categories(id) ON DELETE RESTRICT,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  short_description TEXT NOT NULL,
  overview TEXT NOT NULL,
  duration_minutes INTEGER CHECK (duration_minutes IS NULL OR duration_minutes > 0),
  duration_label TEXT NOT NULL,
  price_minor BIGINT NOT NULL CHECK (price_minor >= 0),
  currency_code CHAR(3) NOT NULL DEFAULT 'USD',
  min_guests INTEGER NOT NULL DEFAULT 1 CHECK (min_guests >= 1),
  max_capacity INTEGER NOT NULL DEFAULT 12 CHECK (max_capacity >= min_guests),
  booking_conditions TEXT,
  cancellation_policy TEXT NOT NULL DEFAULT 'Standard 48-hour operator review applies.',
  publication_status TEXT NOT NULL DEFAULT 'draft'
    CHECK (publication_status IN ('draft', 'pending_review', 'published', 'suspended', 'archived')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.experience_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  experience_id UUID NOT NULL REFERENCES public.experiences(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  alt_text TEXT NOT NULL,
  caption TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_primary BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.accommodation (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id UUID NOT NULL REFERENCES public.suppliers(id) ON DELETE RESTRICT,
  destination_id UUID NOT NULL REFERENCES public.destinations(id) ON DELETE RESTRICT,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  property_type TEXT NOT NULL
    CHECK (property_type IN ('Luxury Lodges', 'Hotels', 'Safari Camps', 'Resorts', 'Boutique Stays')),
  location_label TEXT NOT NULL,
  description TEXT NOT NULL,
  editorial_overview TEXT NOT NULL,
  nightly_rate_minor BIGINT NOT NULL CHECK (nightly_rate_minor >= 0),
  currency_code CHAR(3) NOT NULL DEFAULT 'USD',
  max_guests_per_unit INTEGER NOT NULL DEFAULT 2 CHECK (max_guests_per_unit >= 1),
  cancellation_policy TEXT NOT NULL,
  publication_status TEXT NOT NULL DEFAULT 'draft'
    CHECK (publication_status IN ('draft', 'pending_review', 'published', 'suspended', 'archived')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.accommodation_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  accommodation_id UUID NOT NULL REFERENCES public.accommodation(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  alt_text TEXT NOT NULL,
  caption TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_primary BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.transport_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id UUID NOT NULL REFERENCES public.suppliers(id) ON DELETE RESTRICT,
  destination_id UUID REFERENCES public.destinations(id) ON DELETE SET NULL,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  service_type TEXT NOT NULL
    CHECK (service_type IN ('airport_transfer', 'private_4x4', 'chauffeur_service', 'vehicle_rental', 'group_shuttle')),
  summary TEXT NOT NULL,
  details TEXT NOT NULL,
  price_minor BIGINT NOT NULL CHECK (price_minor >= 0),
  currency_code CHAR(3) NOT NULL DEFAULT 'USD',
  max_passengers INTEGER NOT NULL DEFAULT 4 CHECK (max_passengers >= 1),
  image_url TEXT NOT NULL,
  image_alt TEXT NOT NULL,
  publication_status TEXT NOT NULL DEFAULT 'draft'
    CHECK (publication_status IN ('draft', 'pending_review', 'published', 'suspended', 'archived')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.travel_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id UUID REFERENCES public.suppliers(id) ON DELETE RESTRICT,
  destination_id UUID REFERENCES public.destinations(id) ON DELETE SET NULL,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  duration_label TEXT NOT NULL,
  overview TEXT NOT NULL,
  editorial_intro TEXT NOT NULL,
  price_minor BIGINT NOT NULL CHECK (price_minor >= 0),
  currency_code CHAR(3) NOT NULL DEFAULT 'USD',
  image_url TEXT NOT NULL,
  image_alt TEXT NOT NULL,
  publication_status TEXT NOT NULL DEFAULT 'draft'
    CHECK (publication_status IN ('draft', 'pending_review', 'published', 'suspended', 'archived')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.package_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  package_id UUID NOT NULL REFERENCES public.travel_packages(id) ON DELETE CASCADE,
  day_number INTEGER NOT NULL CHECK (day_number >= 1),
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  experience_id UUID REFERENCES public.experiences(id) ON DELETE SET NULL,
  accommodation_id UUID REFERENCES public.accommodation(id) ON DELETE SET NULL,
  transport_service_id UUID REFERENCES public.transport_services(id) ON DELETE SET NULL,
  sort_order INTEGER NOT NULL DEFAULT 0
);

-- ============================================================================
-- 4. AVAILABILITY & INVENTORY RESERVATIONS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.supplier_availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id UUID NOT NULL REFERENCES public.suppliers(id) ON DELETE CASCADE,
  service_date DATE NOT NULL,
  is_blackout BOOLEAN NOT NULL DEFAULT FALSE,
  notes TEXT,
  UNIQUE (supplier_id, service_date)
);

CREATE TABLE IF NOT EXISTS public.availability_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id UUID NOT NULL REFERENCES public.suppliers(id) ON DELETE CASCADE,
  service_type TEXT NOT NULL CHECK (service_type IN ('experience', 'accommodation', 'transport', 'package')),
  service_id UUID NOT NULL,
  slot_date DATE NOT NULL,
  start_time TIME,
  total_capacity INTEGER NOT NULL CHECK (total_capacity >= 0),
  reserved_capacity INTEGER NOT NULL DEFAULT 0 CHECK (reserved_capacity >= 0),
  confirmed_capacity INTEGER NOT NULL DEFAULT 0 CHECK (confirmed_capacity >= 0),
  price_override_minor BIGINT CHECK (price_override_minor IS NULL OR price_override_minor >= 0),
  currency_code CHAR(3) NOT NULL DEFAULT 'USD',
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed', 'sold_out')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (reserved_capacity + confirmed_capacity <= total_capacity),
  UNIQUE (service_type, service_id, slot_date, start_time)
);

CREATE TABLE IF NOT EXISTS public.inventory_reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  availability_slot_id UUID NOT NULL REFERENCES public.availability_slots(id) ON DELETE RESTRICT,
  customer_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'converted_to_booking', 'expired', 'released')),
  expires_at TIMESTAMPTZ NOT NULL,
  idempotency_key TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 5. BOOKINGS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_reference TEXT NOT NULL UNIQUE,
  customer_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  supplier_id UUID NOT NULL REFERENCES public.suppliers(id) ON DELETE RESTRICT,
  currency_code CHAR(3) NOT NULL DEFAULT 'USD',
  subtotal_minor BIGINT NOT NULL CHECK (subtotal_minor >= 0),
  discount_minor BIGINT NOT NULL DEFAULT 0 CHECK (discount_minor >= 0),
  tax_minor BIGINT NOT NULL DEFAULT 0 CHECK (tax_minor >= 0),
  total_amount_minor BIGINT NOT NULL CHECK (total_amount_minor >= 0),
  status TEXT NOT NULL DEFAULT 'pending_payment'
    CHECK (status IN ('pending_payment', 'awaiting_verification', 'confirmed', 'cancellation_requested', 'cancelled', 'refunded', 'expired', 'failed')),
  payment_status TEXT NOT NULL DEFAULT 'unpaid'
    CHECK (payment_status IN ('unpaid', 'pending', 'paid', 'failed', 'partially_refunded', 'refunded')),
  settlement_reconciliation_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (settlement_reconciliation_status IN ('pending', 'split_allocated', 'settled', 'reconciled', 'discrepancy')),
  special_requests TEXT,
  idempotency_key TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.booking_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  supplier_id UUID NOT NULL REFERENCES public.suppliers(id) ON DELETE RESTRICT,
  service_type TEXT NOT NULL CHECK (service_type IN ('experience', 'accommodation', 'transport', 'package')),
  service_id UUID NOT NULL,
  service_title TEXT NOT NULL,
  availability_slot_id UUID REFERENCES public.availability_slots(id) ON DELETE SET NULL,
  reservation_id UUID REFERENCES public.inventory_reservations(id) ON DELETE SET NULL,
  service_date DATE NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price_minor BIGINT NOT NULL CHECK (unit_price_minor >= 0),
  line_total_minor BIGINT NOT NULL CHECK (line_total_minor >= 0),
  currency_code CHAR(3) NOT NULL DEFAULT 'USD',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.booking_guests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  nationality TEXT,
  is_lead_guest BOOLEAN NOT NULL DEFAULT FALSE,
  dietary_or_medical_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.booking_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  previous_status TEXT,
  new_status TEXT NOT NULL,
  changed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.cancellation_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  requested_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending_review'
    CHECK (status IN ('pending_review', 'approved', 'rejected', 'withdrawn')),
  reviewed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  review_notes TEXT,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 6. COMMISSIONS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.commission_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  scope_type TEXT NOT NULL CHECK (scope_type IN ('global', 'category', 'supplier', 'experience', 'promotion')),
  category_id UUID REFERENCES public.experience_categories(id) ON DELETE CASCADE,
  supplier_id UUID REFERENCES public.suppliers(id) ON DELETE CASCADE,
  experience_id UUID REFERENCES public.experiences(id) ON DELETE CASCADE,
  rate_bps INTEGER NOT NULL CHECK (rate_bps >= 0 AND rate_bps <= 5000),
  priority INTEGER NOT NULL DEFAULT 100,
  is_development_sample BOOLEAN NOT NULL DEFAULT FALSE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  valid_from TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  valid_to TIMESTAMPTZ,
  approved_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.supplier_commission_agreements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id UUID NOT NULL REFERENCES public.suppliers(id) ON DELETE CASCADE,
  commission_rule_id UUID REFERENCES public.commission_rules(id) ON DELETE SET NULL,
  rate_bps INTEGER NOT NULL CHECK (rate_bps >= 0 AND rate_bps <= 5000),
  currency_code CHAR(3) NOT NULL DEFAULT 'USD',
  effective_from TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  effective_to TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('draft', 'active', 'superseded', 'terminated')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.booking_commission_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL UNIQUE REFERENCES public.bookings(id) ON DELETE RESTRICT,
  commission_rule_id UUID REFERENCES public.commission_rules(id) ON DELETE SET NULL,
  commission_agreement_id UUID REFERENCES public.supplier_commission_agreements(id) ON DELETE SET NULL,
  original_unit_price_minor BIGINT NOT NULL CHECK (original_unit_price_minor >= 0),
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  gross_amount_minor BIGINT NOT NULL CHECK (gross_amount_minor >= 0),
  discount_minor BIGINT NOT NULL DEFAULT 0 CHECK (discount_minor >= 0),
  tax_minor BIGINT NOT NULL DEFAULT 0 CHECK (tax_minor >= 0),
  commission_rate_bps INTEGER NOT NULL CHECK (commission_rate_bps >= 0 AND commission_rate_bps <= 10000),
  commission_amount_minor BIGINT NOT NULL CHECK (commission_amount_minor >= 0),
  supplier_share_minor BIGINT NOT NULL CHECK (supplier_share_minor >= 0),
  provider_fee_minor BIGINT CHECK (provider_fee_minor IS NULL OR provider_fee_minor >= 0),
  currency_code CHAR(3) NOT NULL DEFAULT 'USD',
  CHECK (commission_amount_minor + supplier_share_minor + tax_minor = gross_amount_minor - discount_minor),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 7. PAYMENTS & SPLIT TRANSACTIONS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.payment_providers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE CHECK (code IN ('pesepay', 'payonify_relay')),
  display_name TEXT NOT NULL,
  environment TEXT NOT NULL DEFAULT 'sandbox' CHECK (environment IN ('sandbox', 'production')),
  supports_single_beneficiary_split BOOLEAN NOT NULL DEFAULT TRUE,
  supports_multi_beneficiary_split BOOLEAN NOT NULL DEFAULT FALSE,
  split_refunds_verified BOOLEAN NOT NULL DEFAULT FALSE,
  is_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE RESTRICT,
  provider_code TEXT NOT NULL REFERENCES public.payment_providers(code),
  merchant_reference TEXT NOT NULL UNIQUE,
  provider_reference TEXT UNIQUE,
  currency_code CHAR(3) NOT NULL DEFAULT 'USD',
  amount_minor BIGINT NOT NULL CHECK (amount_minor > 0),
  expected_commission_minor BIGINT NOT NULL CHECK (expected_commission_minor >= 0),
  expected_supplier_share_minor BIGINT NOT NULL CHECK (expected_supplier_share_minor >= 0),
  beneficiary_merchant_email TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'initiated'
    CHECK (status IN ('initiated', 'pending_customer', 'processing', 'succeeded', 'failed', 'expired', 'cancelled', 'verification_mismatch')),
  idempotency_key TEXT NOT NULL UNIQUE,
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.payment_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id UUID NOT NULL REFERENCES public.payments(id) ON DELETE CASCADE,
  attempt_number INTEGER NOT NULL CHECK (attempt_number >= 1),
  redirect_url TEXT,
  poll_url TEXT,
  provider_reference TEXT,
  request_metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  response_summary JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'created'
    CHECK (status IN ('created', 'redirected', 'verified_paid', 'failed', 'expired')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (payment_id, attempt_number)
);

CREATE TABLE IF NOT EXISTS public.payment_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id UUID REFERENCES public.payments(id) ON DELETE SET NULL,
  provider_code TEXT NOT NULL,
  provider_event_key TEXT NOT NULL UNIQUE,
  event_type TEXT NOT NULL,
  signature_valid BOOLEAN NOT NULL DEFAULT FALSE,
  independent_check_verified BOOLEAN NOT NULL DEFAULT FALSE,
  raw_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.provider_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id UUID NOT NULL REFERENCES public.payments(id) ON DELETE RESTRICT,
  provider_code TEXT NOT NULL,
  provider_reference TEXT NOT NULL UNIQUE,
  transaction_status TEXT NOT NULL,
  amount_minor BIGINT NOT NULL CHECK (amount_minor >= 0),
  currency_code CHAR(3) NOT NULL,
  payment_method_used TEXT,
  verified_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  verified_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.provider_split_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id UUID NOT NULL REFERENCES public.payments(id) ON DELETE RESTRICT,
  supplier_id UUID NOT NULL REFERENCES public.suppliers(id) ON DELETE RESTRICT,
  beneficiary_arrangement_id UUID REFERENCES public.supplier_beneficiary_arrangements(id) ON DELETE SET NULL,
  split_reference TEXT,
  beneficiary_merchant_email TEXT NOT NULL,
  currency_code CHAR(3) NOT NULL,
  master_commission_minor BIGINT NOT NULL CHECK (master_commission_minor >= 0),
  beneficiary_share_minor BIGINT NOT NULL CHECK (beneficiary_share_minor >= 0),
  split_status TEXT NOT NULL DEFAULT 'pending_allocation'
    CHECK (split_status IN ('pending_allocation', 'allocated', 'failed_investigation_required', 'settled')),
  failure_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 8. REFUNDS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.refunds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE RESTRICT,
  payment_id UUID NOT NULL REFERENCES public.payments(id) ON DELETE RESTRICT,
  cancellation_request_id UUID REFERENCES public.cancellation_requests(id) ON DELETE SET NULL,
  requested_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  approved_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  refund_type TEXT NOT NULL CHECK (refund_type IN ('full', 'partial')),
  currency_code CHAR(3) NOT NULL,
  refund_amount_minor BIGINT NOT NULL CHECK (refund_amount_minor > 0),
  commission_reversal_minor BIGINT NOT NULL DEFAULT 0 CHECK (commission_reversal_minor >= 0),
  supplier_reversal_minor BIGINT NOT NULL DEFAULT 0 CHECK (supplier_reversal_minor >= 0),
  reason TEXT NOT NULL,
  provider_refund_reference TEXT,
  status TEXT NOT NULL DEFAULT 'REQUESTED'
    CHECK (status IN ('REQUESTED', 'UNDER_REVIEW', 'APPROVED', 'PROCESSING', 'SUCCEEDED', 'REJECTED', 'FAILED', 'CANCELLED')),
  provider_limitation_flagged BOOLEAN NOT NULL DEFAULT FALSE,
  idempotency_key TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.refund_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  refund_id UUID NOT NULL REFERENCES public.refunds(id) ON DELETE CASCADE,
  previous_status TEXT,
  new_status TEXT NOT NULL,
  actor_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 9. DOUBLE-ENTRY FINANCIAL LEDGER & RECONCILIATION
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.ledger_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  account_type TEXT NOT NULL CHECK (account_type IN ('asset', 'liability', 'revenue', 'expense', 'clearing')),
  currency_code CHAR(3) NOT NULL,
  is_system BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (code, currency_code)
);

CREATE TABLE IF NOT EXISTS public.ledger_journals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  journal_reference TEXT NOT NULL UNIQUE,
  journal_type TEXT NOT NULL
    CHECK (journal_type IN ('payment_capture', 'commission_split', 'marketplace_settlement', 'supplier_settlement', 'refund_reversal', 'fee_expense', 'manual_reversal')),
  currency_code CHAR(3) NOT NULL,
  booking_id UUID REFERENCES public.bookings(id) ON DELETE RESTRICT,
  payment_id UUID REFERENCES public.payments(id) ON DELETE RESTRICT,
  refund_id UUID REFERENCES public.refunds(id) ON DELETE RESTRICT,
  reverses_journal_id UUID REFERENCES public.ledger_journals(id) ON DELETE RESTRICT,
  provider_reference TEXT,
  description TEXT NOT NULL,
  posted_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  posted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.ledger_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  journal_id UUID NOT NULL REFERENCES public.ledger_journals(id) ON DELETE RESTRICT,
  account_id UUID NOT NULL REFERENCES public.ledger_accounts(id) ON DELETE RESTRICT,
  supplier_id UUID REFERENCES public.suppliers(id) ON DELETE RESTRICT,
  direction TEXT NOT NULL CHECK (direction IN ('debit', 'credit')),
  amount_minor BIGINT NOT NULL CHECK (amount_minor > 0),
  currency_code CHAR(3) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.gateway_settlement_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_code TEXT NOT NULL,
  settlement_reference TEXT NOT NULL UNIQUE,
  currency_code CHAR(3) NOT NULL,
  gross_settled_minor BIGINT NOT NULL CHECK (gross_settled_minor >= 0),
  fees_deducted_minor BIGINT NOT NULL DEFAULT 0 CHECK (fees_deducted_minor >= 0),
  net_settled_minor BIGINT NOT NULL CHECK (net_settled_minor >= 0),
  settlement_date DATE NOT NULL,
  raw_report JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.supplier_settlement_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id UUID NOT NULL REFERENCES public.suppliers(id) ON DELETE RESTRICT,
  payment_id UUID NOT NULL REFERENCES public.payments(id) ON DELETE RESTRICT,
  split_record_id UUID REFERENCES public.provider_split_records(id) ON DELETE SET NULL,
  beneficiary_merchant_email TEXT NOT NULL,
  provider_settlement_reference TEXT,
  currency_code CHAR(3) NOT NULL,
  expected_supplier_share_minor BIGINT NOT NULL CHECK (expected_supplier_share_minor >= 0),
  confirmed_settlement_minor BIGINT CHECK (confirmed_settlement_minor IS NULL OR confirmed_settlement_minor >= 0),
  settlement_date DATE,
  settlement_stage TEXT NOT NULL DEFAULT 'expected_split'
    CHECK (settlement_stage IN ('expected_split', 'confirmed_by_provider', 'reconciled', 'flagged_failed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.reconciliation_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_code TEXT NOT NULL,
  run_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  currency_code CHAR(3) NOT NULL,
  matched_count INTEGER NOT NULL DEFAULT 0,
  discrepancy_count INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('running', 'completed', 'failed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.reconciliation_discrepancies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reconciliation_run_id UUID NOT NULL REFERENCES public.reconciliation_runs(id) ON DELETE CASCADE,
  payment_id UUID REFERENCES public.payments(id) ON DELETE SET NULL,
  discrepancy_type TEXT NOT NULL,
  expected_minor BIGINT NOT NULL,
  observed_minor BIGINT NOT NULL,
  currency_code CHAR(3) NOT NULL,
  resolution_status TEXT NOT NULL DEFAULT 'open' CHECK (resolution_status IN ('open', 'investigating', 'resolved')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 10. CUSTOMER EXPERIENCE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL UNIQUE REFERENCES public.bookings(id) ON DELETE RESTRICT,
  customer_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  experience_id UUID REFERENCES public.experiences(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT NOT NULL,
  moderation_status TEXT NOT NULL DEFAULT 'pending' CHECK (moderation_status IN ('pending', 'published', 'hidden')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  channel TEXT NOT NULL DEFAULT 'in_app' CHECK (channel IN ('in_app', 'email')),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  related_entity_type TEXT,
  related_entity_id UUID,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.customer_support_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  booking_id UUID REFERENCES public.bookings(id) ON DELETE SET NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  assigned_to UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.saved_experiences (
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  experience_id UUID NOT NULL REFERENCES public.experiences(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, experience_id)
);

-- ============================================================================
-- 11. SECURITY AND AUDITING
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id TEXT,
  before_state JSONB,
  after_state JSONB,
  ip_address INET,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.security_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  severity TEXT NOT NULL DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  event_code TEXT NOT NULL,
  summary TEXT NOT NULL,
  ip_address INET,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.administrative_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  action_type TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id TEXT NOT NULL,
  justification TEXT NOT NULL,
  mfa_verified BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- INDEXES & UPDATED_AT TRIGGERS
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_suppliers_owner ON public.suppliers(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_suppliers_status ON public.suppliers(verification_status);
CREATE INDEX IF NOT EXISTS idx_experiences_supplier ON public.experiences(supplier_id, publication_status);
CREATE INDEX IF NOT EXISTS idx_slots_lookup ON public.availability_slots(service_type, service_id, slot_date);
CREATE INDEX IF NOT EXISTS idx_reservations_expiry ON public.inventory_reservations(status, expires_at);
CREATE INDEX IF NOT EXISTS idx_bookings_customer ON public.bookings(customer_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bookings_supplier ON public.bookings(supplier_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payments_booking ON public.payments(booking_id);
CREATE INDEX IF NOT EXISTS idx_ledger_entries_journal ON public.ledger_entries(journal_id);
CREATE INDEX IF NOT EXISTS idx_ledger_entries_supplier ON public.ledger_entries(supplier_id, currency_code);
CREATE INDEX IF NOT EXISTS idx_security_events_created ON public.security_events(created_at DESC, severity);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON public.audit_logs(created_at DESC);

CREATE TRIGGER trg_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_suppliers_updated_at BEFORE UPDATE ON public.suppliers FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_supplier_pay_accounts_updated_at BEFORE UPDATE ON public.supplier_payment_accounts FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_supplier_beneficiaries_updated_at BEFORE UPDATE ON public.supplier_beneficiary_arrangements FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_experiences_updated_at BEFORE UPDATE ON public.experiences FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_accommodation_updated_at BEFORE UPDATE ON public.accommodation FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_bookings_updated_at BEFORE UPDATE ON public.bookings FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_refunds_updated_at BEFORE UPDATE ON public.refunds FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
