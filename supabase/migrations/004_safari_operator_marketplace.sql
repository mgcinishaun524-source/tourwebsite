-- ================================================================
-- TRANSEND TOURS: Safari operator marketplace extension
-- ================================================================

CREATE TABLE IF NOT EXISTS public.operator_profiles (
  supplier_id UUID PRIMARY KEY REFERENCES public.suppliers(id) ON DELETE CASCADE,
  slug TEXT NOT NULL UNIQUE,
  cover_image_url TEXT,
  cover_image_alt TEXT,
  logo_url TEXT,
  company_description TEXT NOT NULL DEFAULT '',
  office_location TEXT,
  countries_served TEXT[] NOT NULL DEFAULT '{}'::TEXT[],
  price_min_per_person_per_day_minor BIGINT,
  price_max_per_person_per_day_minor BIGINT,
  currency_code CHAR(3) NOT NULL DEFAULT 'USD',
  price_tier TEXT NOT NULL DEFAULT 'custom'
  is_featured BOOLEAN NOT NULL DEFAULT FALSE,
  directory_status TEXT NOT NULL DEFAULT 'draft'
    CHECK (directory_status IN ('draft', 'submitted', 'published', 'suspended')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.operator_destinations (
  supplier_id UUID NOT NULL REFERENCES public.suppliers(id) ON DELETE CASCADE,
  destination_id UUID NOT NULL REFERENCES public.destinations(id) ON DELETE CASCADE,
  PRIMARY KEY (supplier_id, destination_id)
);

CREATE TABLE IF NOT EXISTS public.operator_tour_categories (
  supplier_id UUID NOT NULL REFERENCES public.suppliers(id) ON DELETE CASCADE,
  category_slug TEXT NOT NULL,
  PRIMARY KEY (supplier_id, category_slug)
);

CREATE TABLE IF NOT EXISTS public.operator_enquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id UUID NOT NULL REFERENCES public.suppliers(id) ON DELETE CASCADE,
  experience_id UUID REFERENCES public.experiences(id) ON DELETE SET NULL,
  customer_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  party_size INTEGER CHECK (party_size IS NULL OR party_size >= 1),
  preferred_date DATE,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open'
    CHECK (status IN ('open', 'assigned', 'responded', 'closed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS operator_profiles_directory_idx
  ON public.operator_profiles(directory_status, is_featured, slug);
CREATE INDEX IF NOT EXISTS operator_destinations_destination_idx
  ON public.operator_destinations(destination_id);
CREATE INDEX IF NOT EXISTS operator_tour_categories_slug_idx
  ON public.operator_tour_categories(category_slug);
CREATE INDEX IF NOT EXISTS operator_enquiries_supplier_idx
  ON public.operator_enquiries(supplier_id, status, created_at DESC);

DROP TRIGGER IF EXISTS set_operator_profiles_updated_at ON public.operator_profiles;
CREATE TRIGGER set_operator_profiles_updated_at
  BEFORE UPDATE ON public.operator_profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_operator_enquiries_updated_at ON public.operator_enquiries;
CREATE TRIGGER set_operator_enquiries_updated_at
  BEFORE UPDATE ON public.operator_enquiries
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.operator_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.operator_destinations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.operator_tour_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.operator_enquiries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "operator_profiles_public_read" ON public.operator_profiles FOR SELECT
  USING (
    directory_status = 'published'
    AND EXISTS (
      SELECT 1 FROM public.suppliers s
      WHERE s.id = supplier_id
        AND s.verification_status = 'approved'
        AND s.can_accept_paid_bookings = TRUE
    )
    OR public.is_supplier_owner(supplier_id)
    OR public.has_role(ARRAY['admin', 'super_admin', 'operations', 'content_manager'])
  );

CREATE POLICY "operator_profiles_owner_manage" ON public.operator_profiles FOR ALL
  USING (public.is_supplier_owner(supplier_id) OR public.has_role(ARRAY['admin', 'super_admin', 'content_manager']))
  WITH CHECK (public.is_supplier_owner(supplier_id) OR public.has_role(ARRAY['admin', 'super_admin', 'content_manager']));

CREATE POLICY "operator_destinations_public_read" ON public.operator_destinations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.operator_profiles op
      JOIN public.suppliers s ON s.id = op.supplier_id
      WHERE op.supplier_id = operator_destinations.supplier_id
        AND op.directory_status = 'published'
        AND s.verification_status = 'approved'
    )
    OR public.is_supplier_owner(supplier_id)
    OR public.has_role(ARRAY['admin', 'super_admin', 'content_manager', 'operations'])
  );

CREATE POLICY "operator_destinations_owner_manage" ON public.operator_destinations FOR ALL
  USING (public.is_supplier_owner(supplier_id) OR public.has_role(ARRAY['admin', 'super_admin', 'content_manager']))
  WITH CHECK (public.is_supplier_owner(supplier_id) OR public.has_role(ARRAY['admin', 'super_admin', 'content_manager']));

CREATE POLICY "operator_categories_public_read" ON public.operator_tour_categories FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.operator_profiles op
      JOIN public.suppliers s ON s.id = op.supplier_id
      WHERE op.supplier_id = operator_tour_categories.supplier_id
        AND op.directory_status = 'published'
        AND s.verification_status = 'approved'
    )
    OR public.is_supplier_owner(supplier_id)
    OR public.has_role(ARRAY['admin', 'super_admin', 'content_manager', 'operations'])
  );

CREATE POLICY "operator_categories_owner_manage" ON public.operator_tour_categories FOR ALL
  USING (public.is_supplier_owner(supplier_id) OR public.has_role(ARRAY['admin', 'super_admin', 'content_manager']))
  WITH CHECK (public.is_supplier_owner(supplier_id) OR public.has_role(ARRAY['admin', 'super_admin', 'content_manager']));

CREATE POLICY "operator_enquiries_isolated" ON public.operator_enquiries FOR ALL
  USING (
    public.is_supplier_owner(supplier_id)
    OR customer_user_id = auth.uid()
    OR public.has_role(ARRAY['admin', 'super_admin', 'operations', 'content_manager'])
  )
  WITH CHECK (
    customer_user_id = auth.uid()
    OR public.is_supplier_owner(supplier_id)
    OR public.has_role(ARRAY['admin', 'super_admin', 'operations'])
  );
