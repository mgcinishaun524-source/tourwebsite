import { Router } from 'express';
import { getServerConfig, isPesepayConfigured, isSupabaseConfigured } from '../lib/config.ts';
import { ConfigurationRequiredError, getSupabaseAdmin } from '../lib/supabase.ts';
import { requireAuth, type AuthRequest } from '../middleware/auth.ts';
import { pesepayAdapter } from '../payments/pesepayAdapter.ts';
import { payonifyRelayAdapter } from '../payments/payonifyRelayAdapter.ts';

export const publicRouter = Router();

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
