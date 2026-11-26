import crypto from 'node:crypto';
import { Router } from 'express';
import { z } from 'zod';
import { recordAuditLog, sanitizePlainText } from '../lib/security.ts';
import { ConfigurationRequiredError, requireSupabaseAdmin } from '../lib/supabase.ts';
import { requireAuth, type AuthRequest } from '../middleware/auth.ts';

export const suppliersRouter = Router();

const onboardingSchema = z.object({
  legalName: z.string().min(2).max(160),
  tradingName: z.string().min(2).max(160),
  registrationNumber: z.string().max(80).optional().default(''),
  taxIdentificationNumber: z.string().max(80).optional().default(''),
  businessEmail: z.string().email().max(180),
  businessPhone: z.string().min(5).max(40),
  physicalAddress: z.string().max(240).optional().default(''),
  countryCode: z.string().regex(/^[A-Z]{2}$/).default('ZW'),
  pesepayMerchantEmail: z.string().email().max(180),
  settlementCurrency: z.enum(['USD', 'ZWG']).default('USD'),
  submitForReview: z.boolean().default(false),
});

const documentUploadSchema = z.object({
  documentType: z.enum([
    'certificate_of_incorporation',
    'tourism_authority_licence',
    'tax_clearance',
    'director_id',
    'bank_confirmation',
    'insurance_certificate',
    'other',
  ]),
  fileName: z.string().min(3).max(120),
  mimeType: z.enum(['application/pdf', 'image/jpeg', 'image/png', 'image/webp']),
  fileSizeBytes: z.number().int().min(1).max(10 * 1024 * 1024),
});

const agreementSchema = z.object({
  agreementVersion: z.string().min(2).max(40).default('2026-v1'),
  accepted: z.literal(true),
});

const listingSchema = z.object({
  listingType: z.enum(['experience', 'accommodation', 'transport']),
  name: z.string().min(3).max(140),
  shortDescription: z.string().min(10).max(320),
  overview: z.string().min(20).max(2000),
  priceMinor: z.number().int().min(0).max(100_000_000),
  currencyCode: z.enum(['USD', 'ZWG']).default('USD'),
  maxCapacity: z.number().int().min(1).max(200).default(10),
  durationLabel: z.string().min(2).max(80).default('Half Day'),
  propertyType: z
    .enum(['Luxury Lodges', 'Hotels', 'Safari Camps', 'Resorts', 'Boutique Stays'])
    .optional(),
  locationLabel: z.string().max(120).optional(),
  transportType: z
    .enum(['airport_transfer', 'private_4x4', 'chauffeur_service', 'vehicle_rental', 'group_shuttle'])
    .optional(),
  categorySlug: z.string().max(80).optional(),
  destinationSlug: z.string().max(80).optional(),
});

const availabilitySchema = z.object({
  serviceType: z.enum(['experience', 'accommodation', 'transport', 'package']),
  serviceId: z.string().uuid(),
  slotDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  startTime: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/).nullable().optional(),
  totalCapacity: z.number().int().min(1).max(500),
  priceOverrideMinor: z.number().int().min(0).nullable().optional(),
  currencyCode: z.enum(['USD', 'ZWG']).default('USD'),
});

function handleRouteError(err: unknown, res: { status: (c: number) => { json: (b: unknown) => void } }) {
  if (err instanceof ConfigurationRequiredError) {
    res.status(err.statusCode).json({ error: err.message, missingVars: err.missingVars });
    return;
  }
  console.error('Supplier route error:', err);
  res.status(500).json({ error: 'Supplier operation failed unexpectedly.' });
}

suppliersRouter.post('/onboarding', requireAuth, async (req: AuthRequest, res) => {
  const parsed = onboardingSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid supplier onboarding payload', issues: parsed.error.issues });
    return;
  }

  try {
    const supabase = requireSupabaseAdmin();
    const userId = req.authUser!.id;
    const input = parsed.data;

    const { data: existing } = await supabase
      .from('suppliers')
      .select('id, verification_status')
      .eq('owner_user_id', userId)
      .maybeSingle();

    const nextStatus = input.submitForReview
      ? existing?.verification_status === 'approved'
        ? 'approved'
        : 'submitted'
      : existing?.verification_status ?? 'draft';

    const payload = {
      owner_user_id: userId,
      legal_name: sanitizePlainText(input.legalName, 160),
      trading_name: sanitizePlainText(input.tradingName, 160),
      registration_number: sanitizePlainText(input.registrationNumber, 80) || null,
      tax_identification_number: sanitizePlainText(input.taxIdentificationNumber, 80) || null,
      business_email: input.businessEmail.trim().toLowerCase(),
      business_phone: sanitizePlainText(input.businessPhone, 40),
      physical_address: sanitizePlainText(input.physicalAddress, 240) || null,
      country_code: input.countryCode,
      verification_status: nextStatus,
    };

    let supplierRow: { id: string; verification_status: string } | null = null;
    if (existing?.id) {
      const { data, error } = await supabase
        .from('suppliers')
        .update(payload)
        .eq('id', existing.id)
        .select('id, verification_status')
        .single();
      if (error) throw error;
      supplierRow = data;
    } else {
      const { data, error } = await supabase
        .from('suppliers')
        .insert(payload)
        .select('id, verification_status')
        .single();
      if (error) throw error;
      supplierRow = data;
    }

    // Ensure owner holds supplier role
    const { data: supplierRole } = await supabase
      .from('roles')
      .select('id')
      .eq('code', 'supplier')
      .maybeSingle();
    if (supplierRole?.id) {
      await supabase
        .from('user_roles')
        .upsert({ user_id: userId, role_id: supplierRole.id }, { onConflict: 'user_id,role_id' });
    }

    // Upsert supplier Pesepay payout account
    await supabase.from('supplier_payment_accounts').upsert(
      {
        supplier_id: supplierRow!.id,
        provider_code: 'pesepay',
        merchant_email: input.pesepayMerchantEmail.trim().toLowerCase(),
        settlement_currency: input.settlementCurrency,
        status: 'pending',
      },
      { onConflict: 'supplier_id,provider_code,settlement_currency' },
    );

    await recordAuditLog({
      actorUserId: userId,
      action: existing ? 'SUPPLIER_ONBOARDING_UPDATED' : 'SUPPLIER_ONBOARDING_CREATED',
      resourceType: 'supplier',
      resourceId: supplierRow!.id,
      afterState: { verificationStatus: nextStatus },
      ipAddress: req.ip || null,
    });

    res.json({ supplier: supplierRow });
  } catch (err) {
    handleRouteError(err, res);
  }
});

suppliersRouter.get('/me', requireAuth, async (req: AuthRequest, res) => {
  try {
    const supabase = requireSupabaseAdmin();
    const userId = req.authUser!.id;

    const { data: supplier } = await supabase
      .from('suppliers')
      .select('*')
      .eq('owner_user_id', userId)
      .maybeSingle();

    if (!supplier) {
      res.json({ supplier: null });
      return;
    }

    const [docs, history, accounts, arrangements, agreements, experiences, accommodations, transport, slots] =
      await Promise.all([
        supabase.from('supplier_documents').select('*').eq('supplier_id', supplier.id).order('created_at', { ascending: false }),
        supabase
          .from('supplier_verification_records')
          .select('*')
          .eq('supplier_id', supplier.id)
          .order('created_at', { ascending: false }),
        supabase.from('supplier_payment_accounts').select('*').eq('supplier_id', supplier.id),
        supabase.from('supplier_beneficiary_arrangements').select('*').eq('supplier_id', supplier.id),
        supabase.from('supplier_agreements').select('*').eq('supplier_id', supplier.id),
        supabase.from('experiences').select('*').eq('supplier_id', supplier.id).order('created_at', { ascending: false }),
        supabase.from('accommodation').select('*').eq('supplier_id', supplier.id).order('created_at', { ascending: false }),
        supabase.from('transport_services').select('*').eq('supplier_id', supplier.id).order('created_at', { ascending: false }),
        supabase
          .from('availability_slots')
          .select('*')
          .eq('supplier_id', supplier.id)
          .order('slot_date', { ascending: true })
          .limit(100),
      ]);

    res.json({
      supplier,
      documents: docs.data ?? [],
      verificationHistory: history.data ?? [],
      paymentAccounts: accounts.data ?? [],
      beneficiaryArrangements: arrangements.data ?? [],
      agreements: agreements.data ?? [],
      listings: {
        experiences: experiences.data ?? [],
        accommodations: accommodations.data ?? [],
        transport: transport.data ?? [],
      },
      availabilitySlots: slots.data ?? [],
    });
  } catch (err) {
    handleRouteError(err, res);
  }
});

suppliersRouter.post('/me/documents/signed-upload', requireAuth, async (req: AuthRequest, res) => {
  const parsed = documentUploadSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid document metadata', issues: parsed.error.issues });
    return;
  }

  try {
    const supabase = requireSupabaseAdmin();
    const userId = req.authUser!.id;
    const { data: supplier } = await supabase
      .from('suppliers')
      .select('id')
      .eq('owner_user_id', userId)
      .maybeSingle();

    if (!supplier) {
      res.status(404).json({ error: 'Complete initial supplier profile before uploading documents.' });
      return;
    }

    const safeFileName = parsed.data.fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
    const storagePath = `${supplier.id}/${parsed.data.documentType}-${crypto.randomUUID()}-${safeFileName}`;

    const { data: signed, error: signError } = await supabase.storage
      .from('supplier-documents')
      .createSignedUploadUrl(storagePath);

    if (signError) {
      res.status(500).json({ error: 'Unable to prepare private document upload URL.' });
      return;
    }

    const { data: docRow, error: insertErr } = await supabase
      .from('supplier_documents')
      .insert({
        supplier_id: supplier.id,
        document_type: parsed.data.documentType,
        storage_bucket: 'supplier-documents',
        storage_path: storagePath,
        file_name: safeFileName,
        mime_type: parsed.data.mimeType,
        file_size_bytes: parsed.data.fileSizeBytes,
        uploaded_by: userId,
      })
      .select('*')
      .single();

    if (insertErr) throw insertErr;

    res.json({
      document: docRow,
      uploadUrl: signed.signedUrl,
      token: signed.token,
    });
  } catch (err) {
    handleRouteError(err, res);
  }
});

suppliersRouter.post('/me/agreements', requireAuth, async (req: AuthRequest, res) => {
  const parsed = agreementSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Explicit agreement acceptance is required.' });
    return;
  }

  try {
    const supabase = requireSupabaseAdmin();
    const userId = req.authUser!.id;
    const { data: supplier } = await supabase
      .from('suppliers')
      .select('id')
      .eq('owner_user_id', userId)
      .maybeSingle();

    if (!supplier) {
      res.status(404).json({ error: 'Supplier profile not found.' });
      return;
    }

    const { data, error } = await supabase
      .from('supplier_agreements')
      .upsert(
        {
          supplier_id: supplier.id,
          agreement_version: parsed.data.agreementVersion,
          legal_entity_name: 'TRANSEND TOURS (PRIVATE) LIMITED',
          accepted_by_user_id: userId,
          accepted_ip: req.ip || null,
        },
        { onConflict: 'supplier_id,agreement_version' },
      )
      .select('*')
      .single();

    if (error) throw error;

    await recordAuditLog({
      actorUserId: userId,
      action: 'SUPPLIER_AGREEMENT_ACCEPTED',
      resourceType: 'supplier_agreement',
      resourceId: data.id,
      afterState: { version: parsed.data.agreementVersion },
      ipAddress: req.ip || null,
    });

    res.json({ agreement: data });
  } catch (err) {
    handleRouteError(err, res);
  }
});

suppliersRouter.post('/me/listings', requireAuth, async (req: AuthRequest, res) => {
  const parsed = listingSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid service listing payload', issues: parsed.error.issues });
    return;
  }

  try {
    const supabase = requireSupabaseAdmin();
    const userId = req.authUser!.id;
    const { data: supplier } = await supabase
      .from('suppliers')
      .select('id')
      .eq('owner_user_id', userId)
      .maybeSingle();

    if (!supplier) {
      res.status(404).json({ error: 'Create a supplier profile first.' });
      return;
    }

    const input = parsed.data;
    const baseSlug = sanitizePlainText(input.name, 80)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    const slug = `${baseSlug || 'service'}-${crypto.randomUUID().slice(0, 6)}`;

    if (input.listingType === 'experience') {
      const [{ data: dest }, { data: cat }] = await Promise.all([
        supabase.from('destinations').select('id').limit(1).maybeSingle(),
        supabase.from('experience_categories').select('id').limit(1).maybeSingle(),
      ]);

      let destinationId = dest?.id;
      if (!destinationId) {
        const { data: createdDest, error: destErr } = await supabase
          .from('destinations')
          .insert({
            slug: 'victoria-falls',
            name: 'Transend Tours',
            region_tag: 'Zambezi Basin · Zimbabwe',
            short_intro: 'Primary falls rim and Zambezi National Park corridor.',
            overview: 'Verified destination corridor managed by TRANSEND TOURS (PRIVATE) LIMITED.',
            hero_image_url: '/src/assets/images/hero_victoria_falls_1795523621988.jpg',
            hero_image_alt: 'Transend Tours mist plume above Zambezi gorge',
            publication_status: 'published',
          })
          .select('id')
          .single();
        if (destErr) throw destErr;
        destinationId = createdDest.id;
      }

      if (!cat?.id) {
        res.status(400).json({ error: 'No experience categories seeded in database yet.' });
        return;
      }

      const { data, error } = await supabase
        .from('experiences')
        .insert({
          supplier_id: supplier.id,
          destination_id: destinationId,
          category_id: cat.id,
          slug,
          name: sanitizePlainText(input.name, 140),
          short_description: sanitizePlainText(input.shortDescription, 320),
          overview: sanitizePlainText(input.overview, 2000),
          duration_label: sanitizePlainText(input.durationLabel, 80),
          price_minor: input.priceMinor,
          currency_code: input.currencyCode,
          max_capacity: input.maxCapacity,
          publication_status: 'pending_review',
        })
        .select('*')
        .single();

      if (error) throw error;
      res.status(201).json({ listing: data, listingType: 'experience' });
      return;
    }

    if (input.listingType === 'accommodation') {
      const { data: dest } = await supabase.from('destinations').select('id').limit(1).maybeSingle();
      if (!dest?.id) {
        res.status(400).json({ error: 'Seed a destination record before adding accommodation.' });
        return;
      }
      const { data, error } = await supabase
        .from('accommodation')
        .insert({
          supplier_id: supplier.id,
          destination_id: dest.id,
          slug,
          name: sanitizePlainText(input.name, 140),
          property_type: input.propertyType ?? 'Luxury Lodges',
          location_label: sanitizePlainText(input.locationLabel || 'Transend Tours, Zimbabwe', 120),
          description: sanitizePlainText(input.shortDescription, 320),
          editorial_overview: sanitizePlainText(input.overview, 2000),
          nightly_rate_minor: input.priceMinor,
          currency_code: input.currencyCode,
          max_guests_per_unit: input.maxCapacity,
          cancellation_policy: 'Standard operator cancellation notice applies.',
          publication_status: 'pending_review',
        })
        .select('*')
        .single();
      if (error) throw error;
      res.status(201).json({ listing: data, listingType: 'accommodation' });
      return;
    }

    const { data, error } = await supabase
      .from('transport_services')
      .insert({
        supplier_id: supplier.id,
        slug,
        name: sanitizePlainText(input.name, 140),
        service_type: input.transportType ?? 'private_4x4',
        summary: sanitizePlainText(input.shortDescription, 320),
        details: sanitizePlainText(input.overview, 2000),
        price_minor: input.priceMinor,
        currency_code: input.currencyCode,
        max_passengers: input.maxCapacity,
        image_url: '/src/assets/images/transport_luxury_transfer_1795523625914.jpg',
        image_alt: sanitizePlainText(input.name, 140),
        publication_status: 'pending_review',
      })
      .select('*')
      .single();
    if (error) throw error;
    res.status(201).json({ listing: data, listingType: 'transport' });
  } catch (err) {
    handleRouteError(err, res);
  }
});

suppliersRouter.post('/me/availability', requireAuth, async (req: AuthRequest, res) => {
  const parsed = availabilitySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid availability slot payload', issues: parsed.error.issues });
    return;
  }

  try {
    const supabase = requireSupabaseAdmin();
    const userId = req.authUser!.id;
    const { data: supplier } = await supabase
      .from('suppliers')
      .select('id')
      .eq('owner_user_id', userId)
      .maybeSingle();

    if (!supplier) {
      res.status(404).json({ error: 'Supplier profile not found.' });
      return;
    }

    const input = parsed.data;
    const tableMap = {
      experience: 'experiences',
      accommodation: 'accommodation',
      transport: 'transport_services',
      package: 'travel_packages',
    } as const;

    const { data: serviceRow } = await supabase
      .from(tableMap[input.serviceType])
      .select('id, supplier_id')
      .eq('id', input.serviceId)
      .maybeSingle();

    if (!serviceRow || serviceRow.supplier_id !== supplier.id) {
      res.status(403).json({ error: 'You may only configure availability for your own listings.' });
      return;
    }

    const { data, error } = await supabase
      .from('availability_slots')
      .upsert(
        {
          supplier_id: supplier.id,
          service_type: input.serviceType,
          service_id: input.serviceId,
          slot_date: input.slotDate,
          start_time: input.startTime ?? null,
          total_capacity: input.totalCapacity,
          price_override_minor: input.priceOverrideMinor ?? null,
          currency_code: input.currencyCode,
          status: 'open',
        },
        { onConflict: 'service_type,service_id,slot_date,start_time' },
      )
      .select('*')
      .single();

    if (error) throw error;
    res.status(201).json({ slot: data });
  } catch (err) {
    handleRouteError(err, res);
  }
});

suppliersRouter.get('/me/bookings', requireAuth, async (req: AuthRequest, res) => {
  try {
    const supabase = requireSupabaseAdmin();
    const userId = req.authUser!.id;
    const { data: supplier } = await supabase
      .from('suppliers')
      .select('id')
      .eq('owner_user_id', userId)
      .maybeSingle();

    if (!supplier) {
      res.json({ bookings: [] });
      return;
    }

    const { data, error } = await supabase
      .from('bookings')
      .select('*, booking_items(*), booking_commission_snapshots(*), booking_guests(full_name, is_lead_guest)')
      .eq('supplier_id', supplier.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json({ bookings: data ?? [] });
  } catch (err) {
    handleRouteError(err, res);
  }
});

suppliersRouter.get('/me/financials', requireAuth, async (req: AuthRequest, res) => {
  try {
    const supabase = requireSupabaseAdmin();
    const userId = req.authUser!.id;
    const { data: supplier } = await supabase
      .from('suppliers')
      .select('id')
      .eq('owner_user_id', userId)
      .maybeSingle();

    if (!supplier) {
      res.json({ settlements: [], ledgerEntries: [], totalsByCurrency: {} });
      return;
    }

    const [settlementsRes, entriesRes] = await Promise.all([
      supabase
        .from('supplier_settlement_records')
        .select('*')
        .eq('supplier_id', supplier.id)
        .order('created_at', { ascending: false }),
      supabase
        .from('ledger_entries')
        .select('id, direction, amount_minor, currency_code, created_at, ledger_accounts(code, name)')
        .eq('supplier_id', supplier.id)
        .order('created_at', { ascending: false }),
    ]);

    if (settlementsRes.error || entriesRes.error) {
      throw settlementsRes.error || entriesRes.error;
    }

    const totalsByCurrency: Record<
      string,
      { expectedSplitMinor: number; confirmedProviderMinor: number; reconciledMinor: number }
    > = {};

    for (const row of settlementsRes.data ?? []) {
      const curr = String(row.currency_code);
      if (!totalsByCurrency[curr]) {
        totalsByCurrency[curr] = {
          expectedSplitMinor: 0,
          confirmedProviderMinor: 0,
          reconciledMinor: 0,
        };
      }
      if (row.settlement_stage === 'expected_split') {
        totalsByCurrency[curr].expectedSplitMinor += Number(row.expected_supplier_share_minor || 0);
      } else if (row.settlement_stage === 'confirmed_by_provider') {
        totalsByCurrency[curr].confirmedProviderMinor += Number(
          row.confirmed_settlement_minor ?? row.expected_supplier_share_minor ?? 0,
        );
      } else if (row.settlement_stage === 'reconciled') {
        totalsByCurrency[curr].reconciledMinor += Number(
          row.confirmed_settlement_minor ?? row.expected_supplier_share_minor ?? 0,
        );
      }
    }

    res.json({
      settlements: settlementsRes.data ?? [],
      ledgerEntries: entriesRes.data ?? [],
      totalsByCurrency,
    });
  } catch (err) {
    handleRouteError(err, res);
  }
});
