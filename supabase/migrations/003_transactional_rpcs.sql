-- ============================================================================
-- TRANSEND TOURS (PRIVATE) LIMITED
-- Migration 003: Atomic Inventory Reservation, Expiry, Double-Entry Ledger RPC & Initial Roles
-- ============================================================================

-- Atomic concurrency-safe slot reservation using FOR UPDATE row lock
CREATE OR REPLACE FUNCTION public.reserve_inventory_slot(
  p_slot_id UUID,
  p_customer_user_id UUID,
  p_quantity INTEGER,
  p_ttl_minutes INTEGER,
  p_idempotency_key TEXT
)
RETURNS public.inventory_reservations
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_existing public.inventory_reservations;
  v_slot public.availability_slots;
  v_reservation public.inventory_reservations;
BEGIN
  -- Return existing reservation cleanly for idempotent retries
  SELECT * INTO v_existing
  FROM public.inventory_reservations
  WHERE idempotency_key = p_idempotency_key;

  IF FOUND THEN
    RETURN v_existing;
  END IF;

  -- Lock availability slot row to prevent overbooking race conditions
  SELECT * INTO v_slot
  FROM public.availability_slots
  WHERE id = p_slot_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Availability slot not found';
  END IF;

  IF v_slot.status <> 'open' THEN
    RAISE EXCEPTION 'Availability slot is closed';
  END IF;

  IF (v_slot.reserved_capacity + v_slot.confirmed_capacity + p_quantity) > v_slot.total_capacity THEN
    RAISE EXCEPTION 'Insufficient remaining capacity';
  END IF;

  UPDATE public.availability_slots
  SET reserved_capacity = reserved_capacity + p_quantity,
      updated_at = NOW()
  WHERE id = p_slot_id;

  INSERT INTO public.inventory_reservations (
    availability_slot_id,
    customer_user_id,
    quantity,
    status,
    expires_at,
    idempotency_key
  )
  VALUES (
    p_slot_id,
    p_customer_user_id,
    p_quantity,
    'active',
    NOW() + make_interval(mins => GREATEST(p_ttl_minutes, 5)),
    p_idempotency_key
  )
  RETURNING * INTO v_reservation;

  RETURN v_reservation;
END;
$$;

-- Expire stale unpaid inventory reservations atomically
CREATE OR REPLACE FUNCTION public.expire_stale_reservations()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INTEGER := 0;
  rec RECORD;
BEGIN
  FOR rec IN
    SELECT id, availability_slot_id, quantity
    FROM public.inventory_reservations
    WHERE status = 'active' AND expires_at < NOW()
    FOR UPDATE SKIP LOCKED
  LOOP
    UPDATE public.inventory_reservations
    SET status = 'expired', updated_at = NOW()
    WHERE id = rec.id;

    UPDATE public.availability_slots
    SET reserved_capacity = GREATEST(0, reserved_capacity - rec.quantity),
        updated_at = NOW()
    WHERE id = rec.availability_slot_id;

    v_count := v_count + 1;
  END LOOP;

  RETURN v_count;
END;
$$;

-- Post immutable balanced double-entry ledger journal (rejects any imbalance or mixed currencies)
CREATE OR REPLACE FUNCTION public.post_balanced_ledger_journal(
  p_journal_reference TEXT,
  p_journal_type TEXT,
  p_currency_code CHAR(3),
  p_booking_id UUID,
  p_payment_id UUID,
  p_refund_id UUID,
  p_provider_reference TEXT,
  p_description TEXT,
  p_posted_by UUID,
  p_lines JSONB
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_journal_id UUID;
  v_debits BIGINT := 0;
  v_credits BIGINT := 0;
  v_line JSONB;
  v_account_id UUID;
  v_direction TEXT;
  v_amount BIGINT;
  v_supplier_id UUID;
BEGIN
  SELECT id INTO v_journal_id
  FROM public.ledger_journals
  WHERE journal_reference = p_journal_reference;

  IF FOUND THEN
    RETURN v_journal_id;
  END IF;

  IF jsonb_array_length(p_lines) < 2 THEN
    RAISE EXCEPTION 'Double-entry journal requires at least two lines';
  END IF;

  FOR v_line IN SELECT * FROM jsonb_array_elements(p_lines)
  LOOP
    v_direction := v_line->>'direction';
    v_amount := (v_line->>'amount_minor')::BIGINT;
    IF v_amount <= 0 THEN
      RAISE EXCEPTION 'Ledger line amount_minor must be positive integer';
    END IF;
    IF v_direction = 'debit' THEN
      v_debits := v_debits + v_amount;
    ELSIF v_direction = 'credit' THEN
      v_credits := v_credits + v_amount;
    ELSE
      RAISE EXCEPTION 'Invalid ledger direction: %', v_direction;
    END IF;
  END LOOP;

  IF v_debits <> v_credits OR v_debits <= 0 THEN
    RAISE EXCEPTION 'Unbalanced ledger journal: debits (%) <> credits (%)', v_debits, v_credits;
  END IF;

  INSERT INTO public.ledger_journals (
    journal_reference, journal_type, currency_code, booking_id, payment_id,
    refund_id, provider_reference, description, posted_by
  )
  VALUES (
    p_journal_reference, p_journal_type, p_currency_code, p_booking_id, p_payment_id,
    p_refund_id, p_provider_reference, p_description, p_posted_by
  )
  RETURNING id INTO v_journal_id;

  FOR v_line IN SELECT * FROM jsonb_array_elements(p_lines)
  LOOP
    SELECT id INTO v_account_id
    FROM public.ledger_accounts
    WHERE code = v_line->>'account_code' AND currency_code = p_currency_code;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Ledger account % missing for currency %', v_line->>'account_code', p_currency_code;
    END IF;

    v_supplier_id := NULLIF(v_line->>'supplier_id', '')::UUID;

    INSERT INTO public.ledger_entries (
      journal_id, account_id, supplier_id, direction, amount_minor, currency_code
    )
    VALUES (
      v_journal_id,
      v_account_id,
      v_supplier_id,
      v_line->>'direction',
      (v_line->>'amount_minor')::BIGINT,
      p_currency_code
    );
  END LOOP;

  RETURN v_journal_id;
END;
$$;

-- Seed baseline RBAC roles, payment providers, and USD/ZWG ledger accounts
INSERT INTO public.roles (code, name, description, requires_mfa) VALUES
  ('customer', 'Customer', 'Traveller portal access for own bookings and refunds', FALSE),
  ('supplier', 'Supplier', 'Verified tourism supplier managing services, availability and settlements', FALSE),
  ('content_manager', 'Content Manager', 'Curates destinations, editorial journal and catalogue presentation', FALSE),
  ('operations', 'Operations', 'Manages bookings, supplier onboarding reviews and support', TRUE),
  ('finance', 'Finance Personnel', 'Views double-entry ledger, reconciliations and approves refund workflows', TRUE),
  ('admin', 'Administrator', 'Platform operations, moderation and commission rules', TRUE),
  ('super_admin', 'Super Administrator', 'Full governance, role assignments and system controls', TRUE)
ON CONFLICT (code) DO NOTHING;

INSERT INTO public.payment_providers (code, display_name, environment, supports_single_beneficiary_split, supports_multi_beneficiary_split, split_refunds_verified, is_enabled) VALUES
  ('pesepay', 'Pesepay Marketplace Split Payments', 'sandbox', TRUE, FALSE, FALSE, TRUE),
  ('payonify_relay', 'Payonify Relay (Adapter Scaffold)', 'sandbox', TRUE, TRUE, FALSE, FALSE)
ON CONFLICT (code) DO NOTHING;

INSERT INTO public.ledger_accounts (code, name, account_type, currency_code) VALUES
  ('gateway_clearing', 'Payment Gateway Clearing', 'clearing', 'USD'),
  ('marketplace_commission_revenue', 'Transend Tours Commission Revenue', 'revenue', 'USD'),
  ('supplier_settlement_clearing', 'Supplier Split Settlement Clearing', 'clearing', 'USD'),
  ('payment_processing_expense', 'Gateway Processing Expenses', 'expense', 'USD'),
  ('refund_reversal_clearing', 'Refund & Reversal Clearing', 'liability', 'USD'),
  ('tax_liability_payable', 'Applicable Tax Liabilities', 'liability', 'USD'),
  ('gateway_clearing', 'Payment Gateway Clearing', 'clearing', 'ZWG'),
  ('marketplace_commission_revenue', 'Transend Tours Commission Revenue', 'revenue', 'ZWG'),
  ('supplier_settlement_clearing', 'Supplier Split Settlement Clearing', 'clearing', 'ZWG'),
  ('payment_processing_expense', 'Gateway Processing Expenses', 'expense', 'ZWG'),
  ('refund_reversal_clearing', 'Refund & Reversal Clearing', 'liability', 'ZWG'),
  ('tax_liability_payable', 'Applicable Tax Liabilities', 'liability', 'ZWG')
ON CONFLICT (code, currency_code) DO NOTHING;

INSERT INTO public.experience_categories (slug, name, description) VALUES
  ('guided-tours', 'Guided Tours', 'Private waterfall walks and heritage guiding'),
  ('safari-adventures', 'Safari Adventures', 'Game drives and wilderness tracking'),
  ('helicopter-flights', 'Helicopter Flights', 'Aerial circuits above Transend Tours and Batoka Gorge'),
  ('river-cruises', 'River Cruises', 'Upper Zambezi timber voyages and sunset cruises'),
  ('white-water-rafting', 'White-Water Rafting', 'Batoka Gorge basalt rapid expeditions'),
  ('cultural-experiences', 'Cultural Experiences', 'Community craft and heritage visits'),
  ('nature-and-rainforest', 'Nature & Rainforest', 'Rainforest biodiversity walks')
ON CONFLICT (slug) DO NOTHING;
