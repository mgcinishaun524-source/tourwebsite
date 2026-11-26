import { Router } from 'express';
import { z } from 'zod';
import { getServerConfig, isPesepayConfigured, isSupabaseConfigured } from '../lib/config.ts';
import { ConfigurationRequiredError, getSupabaseAdmin } from '../lib/supabase.ts';
import { requireAuth, type AuthRequest } from '../middleware/auth.ts';
import { pesepayAdapter } from '../payments/pesepayAdapter.ts';
import { payonifyRelayAdapter } from '../payments/payonifyRelayAdapter.ts';

export const publicRouter = Router();

const operatorEnquirySchema = z.object({
  fullName: z.string().min(2).max(120),
  email: z.string().email().max(180),
  phone: z.string().max(40).optional().default(''),
  partySize: z.number().int().min(1).max(30).optional(),
  preferredDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  experienceId: z.string().uuid().optional(),
  message: z.string().min(10).max(2000),
});

publicRouter.get('/health', (_req, res) => {
  const cfg = getServerConfig();
  res.json({
    ok: true,
    legalEntity: cfg.companyLegalName,
    brand: cfg.publicBrandName,
    databaseConfigured: isSupabaseConfigured(),
    pesepayConfigured: isPesepayConfigured(),
    paymentEnvironment: cfg.pesepayEnv,
    livePaymentsEnabled: cfg.paymentLiveEnabled,
    timestamp: new Date().toISOString(),
  });
});

publicRouter.get('/system/config-status', (_req, res) => {
  const cfg = getServerConfig();
  res.json({
    legalEntity: cfg.companyLegalName,
    brand: cfg.publicBrandName,
    supabaseConfigured: isSupabaseConfigured(),
    pesepay: pesepayAdapter.getCapabilities(),
    payonifyRelay: payonifyRelayAdapter.getCapabilities(),
    companyProfileConfigured: {
      registrationNumber: Boolean(cfg.companyRegistrationNumber),
      taxNumber: Boolean(cfg.companyTaxNumber),
      supportEmail: Boolean(cfg.companySupportEmail),
      supportPhone: Boolean(cfg.companySupportPhone),
      registeredAddress: Boolean(cfg.companyRegisteredAddress),
    },
  });
});

publicRouter.get('/auth/me', requireAuth, async (req: AuthRequest, res) => {
  try {
    const supabase = getSupabaseAdmin();
    if (!supabase || !req.authUser) {
      throw new ConfigurationRequiredError('Supabase is not configured.', [
        'SUPABASE_URL',
        'SUPABASE_SERVICE_ROLE_KEY',
      ]);
    }

    const { data: supplier } = await supabase
      .from('suppliers')
      .select('id, trading_name, legal_name, verification_status, can_accept_paid_bookings')
      .eq('owner_user_id', req.authUser.id)
      .maybeSingle();

    res.json({
      user: req.authUser,
      supplier: supplier ?? null,
    });
  } catch (err) {
    if (err instanceof ConfigurationRequiredError) {
      res.status(err.statusCode).json({ error: err.message, missingVars: err.missingVars });
      return;
    }
    res.status(500).json({ error: 'Unable to load authenticated user context.' });
  }
});

publicRouter.get('/catalog', async (_req, res) => {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    res.json({
      configured: false,
      message:
        'Live supplier marketplace inventory requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.',
      experiences: [],
      accommodations: [],
      availabilitySlots: [],
    });
    return;
  }

  try {
    const today = new Date().toISOString().slice(0, 10);

    const [expRes, accRes, slotRes] = await Promise.all([
      supabase
        .from('experiences')
        .select(
          'id, slug, name, short_description, duration_label, price_minor, currency_code, min_guests, max_capacity, supplier_id, suppliers!inner(id, trading_name, verification_status, can_accept_paid_bookings)',
        )
        .eq('publication_status', 'published')
        .order('created_at', { ascending: false }),
      supabase
        .from('accommodation')
        .select(
          'id, slug, name, property_type, location_label, description, nightly_rate_minor, currency_code, max_guests_per_unit, supplier_id, suppliers!inner(id, trading_name, verification_status, can_accept_paid_bookings)',
        )
        .eq('publication_status', 'published')
        .order('created_at', { ascending: false }),
      supabase
        .from('availability_slots')
        .select(
          'id, supplier_id, service_type, service_id, slot_date, start_time, total_capacity, reserved_capacity, confirmed_capacity, price_override_minor, currency_code, status',
        )
        .eq('status', 'open')
        .gte('slot_date', today)
        .order('slot_date', { ascending: true })
        .limit(200),
    ]);

    if (expRes.error || accRes.error || slotRes.error) {
      res.status(500).json({ error: 'Failed to query marketplace catalog.' });
      return;
    }

    res.json({
      configured: true,
      experiences: expRes.data ?? [],
      accommodations: accRes.data ?? [],
      availabilitySlots: slotRes.data ?? [],
    });
  } catch {
    res.status(500).json({ error: 'Unable to load live marketplace catalog.' });
  }
});

publicRouter.get('/operators', async (req, res) => {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    res.json({ configured: false, operators: [], destinations: [] });
    return;
  }

  try {
    const search = String(req.query.search ?? '').trim().toLowerCase();
    const country = String(req.query.country ?? '').trim();
    const destination = String(req.query.destination ?? '').trim();
    const priceTier = String(req.query.priceTier ?? '').trim();
    const category = String(req.query.category ?? '').trim();
    const rating = Number(req.query.rating ?? 0);
    const sort = String(req.query.sort ?? 'recommended');

    const { data: profiles, error: profileError } = await supabase
      .from('operator_profiles')
      .select('*')
      .eq('directory_status', 'published')
      .order('is_featured', { ascending: false })
      .order('created_at', { ascending: false });
    if (profileError) throw profileError;

    const supplierIds = (profiles ?? []).map((profile) => profile.supplier_id);
    if (supplierIds.length === 0) {
      res.json({ configured: true, operators: [], destinations: [] });
      return;
    }

    const [suppliersRes, destinationsRes, categoriesRes, toursRes, reviewsRes] = await Promise.all([
      supabase
        .from('suppliers')
        .select('id, trading_name, legal_name, business_email, business_phone, physical_address, country_code, verification_status, can_accept_paid_bookings')
        .in('id', supplierIds)
        .eq('verification_status', 'approved'),
      supabase
        .from('operator_destinations')
        .select('supplier_id, destination_id, destinations(id, slug, name, region_tag)')
        .in('supplier_id', supplierIds),
      supabase
        .from('operator_tour_categories')
        .select('supplier_id, category_slug')
        .in('supplier_id', supplierIds),
      supabase
        .from('experiences')
        .select('id, supplier_id, slug, name, short_description, duration_label, price_minor, currency_code, publication_status, destination_id')
        .in('supplier_id', supplierIds)
        .eq('publication_status', 'published')
        .order('price_minor', { ascending: true }),
      supabase
        .from('reviews')
        .select('experience_id, rating, moderation_status')
        .eq('moderation_status', 'published'),
    ]);
    if (suppliersRes.error || destinationsRes.error || categoriesRes.error || toursRes.error || reviewsRes.error) {
      throw new Error('Unable to load operator marketplace records.');
    }

    const supplierMap = new Map((suppliersRes.data ?? []).map((supplier) => [supplier.id, supplier]));
    const tourMap = new Map<string, unknown[]>();
    for (const tour of toursRes.data ?? []) {
      tourMap.set(tour.supplier_id, [...(tourMap.get(tour.supplier_id) ?? []), tour]);
    }
    const destinationMap = new Map<string, unknown[]>();
    for (const item of destinationsRes.data ?? []) {
      destinationMap.set(item.supplier_id, [...(destinationMap.get(item.supplier_id) ?? []), item.destinations]);
    }
    const categoryMap = new Map<string, string[]>();
    for (const item of categoriesRes.data ?? []) {
      categoryMap.set(item.supplier_id, [...(categoryMap.get(item.supplier_id) ?? []), item.category_slug]);
    }
    const reviewMap = new Map<string, number[]>();
    for (const review of reviewsRes.data ?? []) {
      if (!review.experience_id) continue;
      reviewMap.set(review.experience_id, [...(reviewMap.get(review.experience_id) ?? []), review.rating]);
    }

    let operators = (profiles ?? [])
      .map((profile) => {
        const supplier = supplierMap.get(profile.supplier_id);
        if (!supplier) return null;
        const tours = (tourMap.get(profile.supplier_id) ?? []) as Array<{ id: string; price_minor: number }>;
        const ratings = tours.flatMap((tour) => reviewMap.get(tour.id) ?? []);
        const averageRating = ratings.length
          ? ratings.reduce((sum, value) => sum + value, 0) / ratings.length
          : null;
        return {
          ...profile,
          supplier,
          destinations: destinationMap.get(profile.supplier_id) ?? [],
          categories: categoryMap.get(profile.supplier_id) ?? [],
          tours,
          reviewCount: ratings.length,
          averageRating,
        };
      })
      .filter((operator): operator is NonNullable<typeof operator> => operator !== null);

    if (search) {
      operators = operators.filter((operator) => {
        const destinationNames = (operator.destinations as Array<{ name?: string }>).map((d) => d.name ?? '').join(' ');
        const searchable = [
          operator.supplier.trading_name,
          operator.supplier.country_code,
          operator.office_location,
          destinationNames,
          ...operator.categories,
        ].join(' ').toLowerCase();
        return searchable.includes(search);
      });
    }
    if (country) {
      operators = operators.filter((operator) =>
        operator.countries_served?.includes(country) || operator.supplier.country_code === country,
      );
    }
    if (destination) {
      operators = operators.filter((operator) =>
        (operator.destinations as Array<{ slug?: string }>).some((item) => item.slug === destination),
      );
    }
    if (priceTier) {
      operators = operators.filter((operator) => operator.price_tier === priceTier);
    }
    if (category) {
      operators = operators.filter((operator) => operator.categories.includes(category));
    }
    if (rating > 0) {
      operators = operators.filter((operator) => operator.averageRating !== null && operator.averageRating >= rating);
    }

    if (sort === 'highest-rated') {
      operators.sort((a, b) => (b.averageRating ?? 0) - (a.averageRating ?? 0));
    } else if (sort === 'most-reviewed') {
      operators.sort((a, b) => b.reviewCount - a.reviewCount);
    } else if (sort === 'lowest-price') {
      operators.sort((a, b) => (a.price_min_per_person_per_day_minor ?? Number.MAX_SAFE_INTEGER) - (b.price_min_per_person_per_day_minor ?? Number.MAX_SAFE_INTEGER));
    } else if (sort === 'highest-price') {
      operators.sort((a, b) => (b.price_max_per_person_per_day_minor ?? 0) - (a.price_max_per_person_per_day_minor ?? 0));
    } else if (sort === 'recent') {
      operators.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    } else {
      operators.sort((a, b) => Number(b.is_featured) - Number(a.is_featured));
    }

    const destinationSlugs = new Map<string, { slug: string; name: string }>();
    for (const operator of operators) {
      for (const item of operator.destinations as Array<{ slug?: string; name?: string }>) {
        if (item.slug) destinationSlugs.set(item.slug, { slug: item.slug, name: item.name ?? item.slug });
      }
    }

    res.json({ configured: true, operators, destinations: [...destinationSlugs.values()] });
  } catch (err) {
    console.error('Operator directory error:', err);
    res.status(500).json({ error: 'Unable to load the safari operator directory.' });
  }
});

publicRouter.get('/operators/:slug', async (req, res) => {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    res.status(503).json({ error: 'Operator profiles require database configuration.' });
    return;
  }

  try {
    const { data: profile, error } = await supabase
      .from('operator_profiles')
      .select('*')
      .eq('slug', String(req.params.slug))
      .eq('directory_status', 'published')
      .maybeSingle();
    if (error) throw error;
    if (!profile) {
      res.status(404).json({ error: 'Operator profile not found.' });
      return;
    }

    const [supplierRes, destinationsRes, categoriesRes, toursRes, reviewsRes] = await Promise.all([
      supabase
        .from('suppliers')
        .select('id, trading_name, legal_name, business_email, business_phone, physical_address, country_code, verification_status, can_accept_paid_bookings')
        .eq('id', profile.supplier_id)
        .eq('verification_status', 'approved')
        .maybeSingle(),
      supabase
        .from('operator_destinations')
        .select('destination_id, destinations(id, slug, name, region_tag, short_intro)')
        .eq('supplier_id', profile.supplier_id),
      supabase
        .from('operator_tour_categories')
        .select('category_slug')
        .eq('supplier_id', profile.supplier_id),
      supabase
        .from('experiences')
        .select('*')
        .eq('supplier_id', profile.supplier_id)
        .eq('publication_status', 'published')
        .order('price_minor', { ascending: true }),
      supabase
        .from('reviews')
        .select('id, experience_id, rating, comment, created_at, moderation_status')
        .eq('moderation_status', 'published'),
    ]);
    if (supplierRes.error || !supplierRes.data) {
      res.status(404).json({ error: 'Operator profile is not currently available.' });
      return;
    }

    const tours = toursRes.data ?? [];
    const tourIds = new Set(tours.map((tour) => tour.id));
    const publishedReviews = (reviewsRes.data ?? []).filter((review) => review.experience_id && tourIds.has(review.experience_id));
    const averageRating = publishedReviews.length
      ? publishedReviews.reduce((sum, review) => sum + review.rating, 0) / publishedReviews.length
      : null;

    res.json({
      operator: {
        ...profile,
        supplier: supplierRes.data,
        destinations: (destinationsRes.data ?? []).map((item) => item.destinations),
        categories: (categoriesRes.data ?? []).map((item) => item.category_slug),
        tours,
        reviews: publishedReviews,
        reviewCount: publishedReviews.length,
        averageRating,
      },
    });
  } catch (err) {
    console.error('Operator profile error:', err);
    res.status(500).json({ error: 'Unable to load the operator profile.' });
  }
});

publicRouter.post('/operators/:slug/enquiries', async (req, res) => {
  const parsed = operatorEnquirySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid operator enquiry', issues: parsed.error.issues });
    return;
  }
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    res.status(503).json({ error: 'Enquiries require database configuration.' });
    return;
  }

  try {
    const { data: profile } = await supabase
      .from('operator_profiles')
      .select('supplier_id')
      .eq('slug', String(req.params.slug))
      .eq('directory_status', 'published')
      .maybeSingle();
    if (!profile) {
      res.status(404).json({ error: 'Operator profile not found.' });
      return;
    }
    const { data: supplier } = await supabase
      .from('suppliers')
      .select('id, verification_status')
      .eq('id', profile.supplier_id)
      .eq('verification_status', 'approved')
      .maybeSingle();
    if (!supplier) {
      res.status(404).json({ error: 'Operator is not available for enquiries.' });
      return;
    }

    if (parsed.data.experienceId) {
      const { data: tour } = await supabase
        .from('experiences')
        .select('id')
        .eq('id', parsed.data.experienceId)
        .eq('supplier_id', supplier.id)
        .eq('publication_status', 'published')
        .maybeSingle();
      if (!tour) {
        res.status(400).json({ error: 'The selected tour is not available from this operator.' });
        return;
      }
    }

    const { data: enquiry, error } = await supabase
      .from('operator_enquiries')
      .insert({
        supplier_id: supplier.id,
        experience_id: parsed.data.experienceId ?? null,
        full_name: parsed.data.fullName.trim(),
        email: parsed.data.email.trim().toLowerCase(),
        phone: parsed.data.phone || null,
        party_size: parsed.data.partySize ?? null,
        preferred_date: parsed.data.preferredDate ?? null,
        message: parsed.data.message.trim(),
      })
      .select('id')
      .single();
    if (error) throw error;
    res.status(201).json({ enquiryId: enquiry.id });
  } catch (err) {
    console.error('Operator enquiry error:', err);
    res.status(500).json({ error: 'Unable to submit the operator enquiry.' });
  }
});
