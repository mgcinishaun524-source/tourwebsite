-- ============================================================================
-- TRANSEND TOURS (PRIVATE) LIMITED
-- Migration 002: Row Level Security (RLS), RBAC Helpers & Private Document Storage
-- ============================================================================

CREATE OR REPLACE FUNCTION public.has_role(target_roles TEXT[])
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles ur
    JOIN public.roles r ON r.id = ur.role_id
    WHERE ur.user_id = auth.uid()
      AND r.code = ANY(target_roles)
  );
$$;

CREATE OR REPLACE FUNCTION public.is_supplier_owner(target_supplier_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.suppliers s
    WHERE s.id = target_supplier_id
      AND s.owner_user_id = auth.uid()
  );
$$;

-- Enable RLS across all public tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auth_sessions_audit ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplier_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplier_verification_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplier_payment_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplier_beneficiary_arrangements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplier_agreements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.destinations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.experience_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.experiences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.experience_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accommodation ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accommodation_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transport_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.travel_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.package_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplier_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.availability_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_guests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cancellation_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commission_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplier_commission_agreements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_commission_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provider_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provider_split_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.refunds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.refund_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ledger_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ledger_journals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ledger_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gateway_settlement_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplier_settlement_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reconciliation_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reconciliation_discrepancies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_support_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_experiences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.administrative_actions ENABLE ROW LEVEL SECURITY;

-- Profiles: own profile or admin/operations read
CREATE POLICY "profiles_self_select" ON public.profiles FOR SELECT
  USING (id = auth.uid() OR public.has_role(ARRAY['admin', 'super_admin', 'operations', 'finance']));
CREATE POLICY "profiles_self_update" ON public.profiles FOR UPDATE
  USING (id = auth.uid()) WITH CHECK (id = auth.uid());

-- Roles: authenticated read, super_admin/admin manage
CREATE POLICY "user_roles_self_select" ON public.user_roles FOR SELECT
  USING (user_id = auth.uid() OR public.has_role(ARRAY['admin', 'super_admin']));

-- Suppliers & sensitive merchant records: strict supplier owner OR admin/finance/operations
CREATE POLICY "suppliers_select" ON public.suppliers FOR SELECT
  USING (
    owner_user_id = auth.uid()
    OR verification_status = 'approved'
    OR public.has_role(ARRAY['admin', 'super_admin', 'operations', 'finance'])
  );
CREATE POLICY "suppliers_owner_insert" ON public.suppliers FOR INSERT
  WITH CHECK (owner_user_id = auth.uid());
CREATE POLICY "suppliers_owner_update" ON public.suppliers FOR UPDATE
  USING (owner_user_id = auth.uid() OR public.has_role(ARRAY['admin', 'super_admin']));

CREATE POLICY "supplier_docs_isolated" ON public.supplier_documents FOR ALL
  USING (public.is_supplier_owner(supplier_id) OR public.has_role(ARRAY['admin', 'super_admin', 'operations']));

CREATE POLICY "supplier_payment_accounts_isolated" ON public.supplier_payment_accounts FOR SELECT
  USING (public.is_supplier_owner(supplier_id) OR public.has_role(ARRAY['admin', 'super_admin', 'finance']));

CREATE POLICY "supplier_beneficiary_isolated" ON public.supplier_beneficiary_arrangements FOR SELECT
  USING (public.is_supplier_owner(supplier_id) OR public.has_role(ARRAY['admin', 'super_admin', 'finance']));

-- Public published catalogue (unauthenticated read of published items only)
CREATE POLICY "destinations_public_read" ON public.destinations FOR SELECT
  USING (publication_status = 'published' OR public.has_role(ARRAY['admin', 'super_admin', 'content_manager']));
CREATE POLICY "categories_public_read" ON public.experience_categories FOR SELECT USING (TRUE);
CREATE POLICY "experiences_read" ON public.experiences FOR SELECT
  USING (publication_status = 'published' OR public.is_supplier_owner(supplier_id) OR public.has_role(ARRAY['admin', 'super_admin', 'content_manager', 'operations']));
CREATE POLICY "accommodation_read" ON public.accommodation FOR SELECT
  USING (publication_status = 'published' OR public.is_supplier_owner(supplier_id) OR public.has_role(ARRAY['admin', 'super_admin', 'content_manager', 'operations']));
CREATE POLICY "transport_read" ON public.transport_services FOR SELECT
  USING (publication_status = 'published' OR public.is_supplier_owner(supplier_id) OR public.has_role(ARRAY['admin', 'super_admin', 'content_manager', 'operations']));
CREATE POLICY "packages_read" ON public.travel_packages FOR SELECT
  USING (publication_status = 'published' OR public.has_role(ARRAY['admin', 'super_admin', 'content_manager', 'operations']));
CREATE POLICY "slots_read" ON public.availability_slots FOR SELECT
  USING (status = 'open' OR public.is_supplier_owner(supplier_id) OR public.has_role(ARRAY['admin', 'super_admin', 'operations']));

-- Bookings: customer sees own bookings, supplier sees bookings for their services, finance/ops/admin scoped read
CREATE POLICY "bookings_isolated_read" ON public.bookings FOR SELECT
  USING (
    customer_user_id = auth.uid()
    OR public.is_supplier_owner(supplier_id)
    OR public.has_role(ARRAY['admin', 'super_admin', 'operations', 'finance'])
  );

CREATE POLICY "booking_items_isolated_read" ON public.booking_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.bookings b
      WHERE b.id = booking_id
        AND (b.customer_user_id = auth.uid() OR public.is_supplier_owner(b.supplier_id) OR public.has_role(ARRAY['admin', 'super_admin', 'operations', 'finance']))
    )
  );

CREATE POLICY "commission_snapshots_isolated" ON public.booking_commission_snapshots FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.bookings b
      WHERE b.id = booking_id
        AND (public.is_supplier_owner(b.supplier_id) OR public.has_role(ARRAY['admin', 'super_admin', 'finance']))
    )
  );

CREATE POLICY "payments_isolated_read" ON public.payments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.bookings b
      WHERE b.id = booking_id
        AND (b.customer_user_id = auth.uid() OR public.is_supplier_owner(b.supplier_id) OR public.has_role(ARRAY['admin', 'super_admin', 'finance']))
    )
  );

-- Refunds & Settlement Records
CREATE POLICY "refunds_isolated_read" ON public.refunds FOR SELECT
  USING (
    requested_by = auth.uid()
    OR EXISTS (SELECT 1 FROM public.bookings b WHERE b.id = booking_id AND public.is_supplier_owner(b.supplier_id))
    OR public.has_role(ARRAY['admin', 'super_admin', 'finance', 'operations'])
  );

CREATE POLICY "supplier_settlements_isolated_read" ON public.supplier_settlement_records FOR SELECT
  USING (public.is_supplier_owner(supplier_id) OR public.has_role(ARRAY['admin', 'super_admin', 'finance']));

-- Ledger & Audit Logs: Finance + Admin only (ledger entries immutable: no UPDATE/DELETE policies granted)
CREATE POLICY "ledger_finance_read" ON public.ledger_journals FOR SELECT
  USING (public.has_role(ARRAY['finance', 'admin', 'super_admin']));
CREATE POLICY "ledger_entries_finance_read" ON public.ledger_entries FOR SELECT
  USING (public.has_role(ARRAY['finance', 'admin', 'super_admin']) OR public.is_supplier_owner(supplier_id));
CREATE POLICY "audit_logs_privileged_read" ON public.audit_logs FOR SELECT
  USING (public.has_role(ARRAY['admin', 'super_admin', 'finance']));
CREATE POLICY "security_events_admin_read" ON public.security_events FOR SELECT
  USING (public.has_role(ARRAY['admin', 'super_admin']));

-- Customer saved items & notifications
CREATE POLICY "saved_experiences_self" ON public.saved_experiences FOR ALL
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "notifications_self" ON public.notifications FOR SELECT
  USING (recipient_user_id = auth.uid());
CREATE POLICY "support_requests_self" ON public.customer_support_requests FOR ALL
  USING (customer_user_id = auth.uid() OR public.has_role(ARRAY['admin', 'super_admin', 'operations']));

-- Private Storage bucket for supplier KYC/verification documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('supplier-documents', 'supplier-documents', FALSE)
ON CONFLICT (id) DO NOTHING;
