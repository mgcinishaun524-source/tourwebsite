import crypto from 'node:crypto';
import { Router } from 'express';
import { z } from 'zod';
import { recordAuditLog, sanitizePlainText } from '../lib/security.ts';
import { ConfigurationRequiredError, requireSupabaseAdmin } from '../lib/supabase.ts';
import { requireAuth, type AuthRequest } from '../middleware/auth.ts';
import {
  calculateCommissionSnapshot,
  selectEffectiveCommissionRule,
  type CommissionRuleCandidate,
} from '../services/commission.ts';

export const bookingsRouter = Router();

const cartItemSchema = z.object({
  slotId: z.string().uuid(),
  quantity: z.number().int().min(1).max(30),
});

const reserveSchema = z.object({
  idempotencyKey: z.string().min(8).max(128),
  specialRequests: z.string().max(1000).optional().default(''),
  leadGuest: z.object({
    fullName: z.string().min(2).max(120),
    email: z.string().email().max(180),
    phone: z.string().min(5).max(40),
    nationality: z.string().max(80).optional().default(''),
  }),
  items: z.array(cartItemSchema).min(1).max(12),
});

interface ResolvedCheckoutItem {
  slotId: string;
  supplierId: string;
  supplierName: string;
  beneficiaryEmail: string;
  serviceType: 'experience' | 'accommodation' | 'transport' | 'package';
  serviceId: string;
  serviceTitle: string;
  categoryId: string | null;
  slotDate: string;
  quantity: number;
  unitPriceMinor: number;
  currencyCode: string;
  remainingCapacity: number;
}

async function resolveCheckoutItems(items: Array<{ slotId: string; quantity: number }>) {
  const supabase = requireSupabaseAdmin();
  const slotIds = items.map((i) => i.slotId);

  const { data: slots, error: slotErr } = await supabase
    .from('availability_slots')
    .select(
      'id, supplier_id, service_type, service_id, slot_date, total_capacity, reserved_capacity, confirmed_capacity, price_override_minor, currency_code, status',
    )
    .in('id', slotIds);

  if (slotErr) throw slotErr;

  const slotMap = new Map((slots ?? []).map((s) => [s.id, s]));
  const resolved: ResolvedCheckoutItem[] = [];

  for (const item of items) {
    const slot = slotMap.get(item.slotId);
    if (!slot) {
      throw new Error(`Availability slot ${item.slotId} does not exist.`);
    }
    if (slot.status !== 'open') {
      throw new Error(`Availability slot on ${slot.slot_date} is closed.`);
    }
    const remaining =
      Number(slot.total_capacity) -
      Number(slot.reserved_capacity) -
      Number(slot.confirmed_capacity);
    if (remaining < item.quantity) {
      throw new Error(
        `Insufficient capacity on ${slot.slot_date} (${remaining} remaining, requested ${item.quantity}).`,
      );
    }

    const { data: supplier } = await supabase
      .from('suppliers')
      .select('id, trading_name, verification_status, can_accept_paid_bookings')
      .eq('id', slot.supplier_id)
      .single();

    if (!supplier || supplier.verification_status !== 'approved' || !supplier.can_accept_paid_bookings) {
      throw new Error(
        `Supplier for slot ${item.slotId} is not yet approved for paid split-payment bookings.`,
      );
    }

    const { data: beneficiary } = await supabase
      .from('supplier_beneficiary_arrangements')
      .select('beneficiary_email, arrangement_status')
      .eq('supplier_id', supplier.id)
      .eq('provider_code', 'pesepay')
      .eq('arrangement_status', 'active')
      .maybeSingle();

    if (!beneficiary?.beneficiary_email) {
      throw new Error(
        `Supplier ${supplier.trading_name} does not have an active Pesepay beneficiary split arrangement.`,
      );
    }

    let serviceTitle = 'Curated Service';
    let basePriceMinor = Number(slot.price_override_minor ?? 0);
    let categoryId: string | null = null;
    let serviceCurrency = String(slot.currency_code);

    if (slot.service_type === 'experience') {
      const { data: exp } = await supabase
        .from('experiences')
        .select('name, price_minor, currency_code, category_id, publication_status')
        .eq('id', slot.service_id)
        .single();
      if (!exp || exp.publication_status !== 'published') {
        throw new Error('Selected experience is unavailable for booking.');
      }
      serviceTitle = exp.name;
      if (slot.price_override_minor === null) basePriceMinor = Number(exp.price_minor);
      categoryId = exp.category_id;
      serviceCurrency = exp.currency_code;
    } else if (slot.service_type === 'accommodation') {
      const { data: acc } = await supabase
        .from('accommodation')
        .select('name, nightly_rate_minor, currency_code, publication_status')
        .eq('id', slot.service_id)
        .single();
      if (!acc || acc.publication_status !== 'published') {
        throw new Error('Selected accommodation is unavailable for booking.');
      }
      serviceTitle = acc.name;
      if (slot.price_override_minor === null) basePriceMinor = Number(acc.nightly_rate_minor);
      serviceCurrency = acc.currency_code;
    } else if (slot.service_type === 'transport') {
      const { data: tr } = await supabase
        .from('transport_services')
        .select('name, price_minor, currency_code, publication_status')
        .eq('id', slot.service_id)
        .single();
      if (!tr || tr.publication_status !== 'published') {
        throw new Error('Selected transport service is unavailable for booking.');
      }
      serviceTitle = tr.name;
      if (slot.price_override_minor === null) basePriceMinor = Number(tr.price_minor);
      serviceCurrency = tr.currency_code;
    }

    if (basePriceMinor <= 0) {
      throw new Error(`Service "${serviceTitle}" does not have a valid server price configured.`);
    }

    resolved.push({
      slotId: slot.id,
      supplierId: supplier.id,
      supplierName: supplier.trading_name,
      beneficiaryEmail: beneficiary.beneficiary_email,
      serviceType: slot.service_type,
      serviceId: slot.service_id,
      serviceTitle,
      categoryId,
      slotDate: slot.slot_date,
      quantity: item.quantity,
      unitPriceMinor: basePriceMinor,
      currencyCode: serviceCurrency,
      remainingCapacity: remaining,
    });
  }

  return resolved;
}

async function computeGroupCommissionSnapshot(groupItems: ResolvedCheckoutItem[]) {
  const supabase = requireSupabaseAdmin();
  const supplierId = groupItems[0].supplierId;
  const currencyCode = groupItems[0].currencyCode;
  const subtotalMinor = groupItems.reduce(
    (sum, item) => sum + item.unitPriceMinor * item.quantity,
    0,
  );

  // Check active supplier agreement or commission rules
  const [{ data: agreement }, { data: rules }] = await Promise.all([
    supabase
      .from('supplier_commission_agreements')
      .select('id, rate_bps')
      .eq('supplier_id', supplierId)
      .eq('currency_code', currencyCode)
      .eq('status', 'active')
      .order('effective_from', { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from('commission_rules')
      .select('id, scope_type, category_id, supplier_id, experience_id, rate_bps, priority, is_development_sample')
      .eq('is_active', true),
  ]);

  let rateBps = agreement?.rate_bps ?? null;
  let selectedRuleId: string | null = null;
  let isDevelopmentSample = false;

  if (rateBps === null) {
    const firstExpId = groupItems.find((i) => i.serviceType === 'experience')?.serviceId;
    const firstCatId = groupItems.find((i) => i.categoryId)?.categoryId;

    const matching: CommissionRuleCandidate[] = (rules ?? [])
      .filter((rule) => {
        if (rule.scope_type === 'experience') return rule.experience_id === firstExpId;
        if (rule.scope_type === 'supplier') return rule.supplier_id === supplierId;
        if (rule.scope_type === 'category') return rule.category_id === firstCatId;
        return rule.scope_type === 'global' || rule.scope_type === 'promotion';
      })
      .map((rule) => ({
        id: rule.id,
        scopeType: rule.scope_type,
        rateBps: rule.rate_bps,
        priority: rule.priority,
        isDevelopmentSample: rule.is_development_sample,
      }));

    const selected = selectEffectiveCommissionRule(matching);
    if (selected) {
      rateBps = selected.rateBps;
      selectedRuleId = selected.id;
      isDevelopmentSample = Boolean(selected.isDevelopmentSample);
    } else {
      // Conservative fallback rule flagged explicitly if no admin rule is configured yet
      rateBps = 1000;
      isDevelopmentSample = true;
    }
  }

  const snapshot = calculateCommissionSnapshot({
    unitPriceMinor: subtotalMinor,
    quantity: 1,
    rateBps,
    currencyCode,
    commissionRuleId: selectedRuleId,
    commissionAgreementId: agreement?.id ?? null,
  });

  return {
    snapshot,
    isDevelopmentSample,
  };
}

bookingsRouter.post('/prepare-checkout', requireAuth, async (req: AuthRequest, res) => {
  const parsed = z.object({ items: z.array(cartItemSchema).min(1).max(12) }).safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid cart selection', issues: parsed.error.issues });
    return;
  }

  try {
    const resolved = await resolveCheckoutItems(parsed.data.items);
    const groupsMap = new Map<string, ResolvedCheckoutItem[]>();

    for (const item of resolved) {
      const groupKey = `${item.supplierId}:${item.currencyCode}`;
      const list = groupsMap.get(groupKey) ?? [];
      list.push(item);
      groupsMap.set(groupKey, list);
    }

    const splitGroups = [];
    for (const [, groupItems] of groupsMap) {
      const { snapshot, isDevelopmentSample } = await computeGroupCommissionSnapshot(groupItems);
      splitGroups.push({
        supplierId: groupItems[0].supplierId,
        supplierName: groupItems[0].supplierName,
        beneficiaryMerchantEmail: groupItems[0].beneficiaryEmail,
        currencyCode: groupItems[0].currencyCode,
        items: groupItems,
        pricing: snapshot,
        isDevelopmentSampleRate: isDevelopmentSample,
      });
    }

    res.json({
      requiresSplitTransactions: splitGroups.length > 1,
      splitNotice:
        splitGroups.length > 1
          ? 'Pesepay supports one beneficiary merchant per split transaction. Your multi-supplier itinerary is automatically partitioned into separate supplier checkout authorizations so each supplier receives its exact verified share.'
          : null,
      groups: splitGroups,
    });
  } catch (err) {
    if (err instanceof ConfigurationRequiredError) {
      res.status(err.statusCode).json({ error: err.message, missingVars: err.missingVars });
      return;
    }
    res.status(400).json({ error: err instanceof Error ? err.message : 'Unable to prepare checkout.' });
  }
});

bookingsRouter.post('/reserve', requireAuth, async (req: AuthRequest, res) => {
  const parsed = reserveSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid booking reservation payload', issues: parsed.error.issues });
    return;
  }

  try {
    const supabase = requireSupabaseAdmin();
    const userId = req.authUser!.id;
    const input = parsed.data;

    // Expire any stale unpaid holds before checking capacity
    await supabase.rpc('expire_stale_reservations');

    const resolved = await resolveCheckoutItems(input.items);
    const groupsMap = new Map<string, ResolvedCheckoutItem[]>();
    for (const item of resolved) {
      const key = `${item.supplierId}:${item.currencyCode}`;
      const list = groupsMap.get(key) ?? [];
      list.push(item);
      groupsMap.set(key, list);
    }

    const createdBookings = [];

    for (const [groupKey, groupItems] of groupsMap) {
      const groupIdem = `${input.idempotencyKey}:${groupKey}`;

      const { data: existingBooking } = await supabase
        .from('bookings')
        .select('*, booking_items(*), booking_commission_snapshots(*)')
        .eq('idempotency_key', groupIdem)
        .maybeSingle();

      if (existingBooking) {
        createdBookings.push(existingBooking);
        continue;
      }

      const { snapshot } = await computeGroupCommissionSnapshot(groupItems);

      // Reserve each availability slot atomically with FOR UPDATE RPC
      const reservations = [];
      for (const item of groupItems) {
        const slotIdem = `${groupIdem}:${item.slotId}`;
        const { data: resRow, error: rpcErr } = await supabase.rpc('reserve_inventory_slot', {
          p_slot_id: item.slotId,
          p_customer_user_id: userId,
          p_quantity: item.quantity,
          p_ttl_minutes: 20,
          p_idempotency_key: slotIdem,
        });
        if (rpcErr) {
          throw new Error(rpcErr.message || 'Unable to lock requested inventory slot.');
        }
        reservations.push({ item, reservationId: resRow.id as string });
      }

      const bookingRef = `TT-${new Date().getFullYear()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;

      const { data: bookingRow, error: bErr } = await supabase
        .from('bookings')
        .insert({
          booking_reference: bookingRef,
          customer_user_id: userId,
          supplier_id: groupItems[0].supplierId,
          currency_code: snapshot.currencyCode,
          subtotal_minor: snapshot.grossAmountMinor,
          discount_minor: snapshot.discountMinor,
          tax_minor: snapshot.taxMinor,
          total_amount_minor: snapshot.grossAmountMinor - snapshot.discountMinor,
          status: 'pending_payment',
          payment_status: 'unpaid',
          special_requests: sanitizePlainText(input.specialRequests, 1000) || null,
          idempotency_key: groupIdem,
        })
        .select('*')
        .single();

      if (bErr) throw bErr;

      const itemsToInsert = reservations.map(({ item, reservationId }) => ({
        booking_id: bookingRow.id,
        supplier_id: item.supplierId,
        service_type: item.serviceType,
        service_id: item.serviceId,
        service_title: item.serviceTitle,
        availability_slot_id: item.slotId,
        reservation_id: reservationId,
        service_date: item.slotDate,
        quantity: item.quantity,
        unit_price_minor: item.unitPriceMinor,
        line_total_minor: item.unitPriceMinor * item.quantity,
        currency_code: item.currencyCode,
      }));

      await supabase.from('booking_items').insert(itemsToInsert);

      await supabase.from('booking_guests').insert({
        booking_id: bookingRow.id,
        full_name: sanitizePlainText(input.leadGuest.fullName, 120),
        email: input.leadGuest.email.trim().toLowerCase(),
        phone: sanitizePlainText(input.leadGuest.phone, 40),
        nationality: sanitizePlainText(input.leadGuest.nationality, 80) || null,
        is_lead_guest: true,
      });

      await supabase.from('booking_commission_snapshots').insert({
        booking_id: bookingRow.id,
        commission_rule_id: snapshot.commissionRuleId,
        commission_agreement_id: snapshot.commissionAgreementId,
        original_unit_price_minor: snapshot.originalUnitPriceMinor,
        quantity: snapshot.quantity,
        gross_amount_minor: snapshot.grossAmountMinor,
        discount_minor: snapshot.discountMinor,
        tax_minor: snapshot.taxMinor,
        commission_rate_bps: snapshot.commissionRateBps,
        commission_amount_minor: snapshot.commissionAmountMinor,
        supplier_share_minor: snapshot.supplierShareMinor,
        currency_code: snapshot.currencyCode,
      });

      await supabase.from('booking_status_history').insert({
        booking_id: bookingRow.id,
        previous_status: null,
        new_status: 'pending_payment',
        changed_by: userId,
        reason: 'Inventory reserved pending verified gateway payment',
      });

      await recordAuditLog({
        actorUserId: userId,
        action: 'BOOKING_RESERVED',
        resourceType: 'booking',
        resourceId: bookingRow.id,
        afterState: {
          bookingReference: bookingRef,
          totalAmountMinor: bookingRow.total_amount_minor,
          currencyCode: bookingRow.currency_code,
        },
        ipAddress: req.ip || null,
      });

      createdBookings.push(bookingRow);
    }

    res.status(201).json({ bookings: createdBookings });
  } catch (err) {
    if (err instanceof ConfigurationRequiredError) {
      res.status(err.statusCode).json({ error: err.message, missingVars: err.missingVars });
      return;
    }
    res.status(400).json({ error: err instanceof Error ? err.message : 'Unable to reserve booking.' });
  }
});

bookingsRouter.get('/mine', requireAuth, async (req: AuthRequest, res) => {
  try {
    const supabase = requireSupabaseAdmin();
    const { data, error } = await supabase
      .from('bookings')
      .select(
        '*, suppliers(trading_name), booking_items(*), booking_commission_snapshots(*), payments(id, merchant_reference, provider_reference, status, amount_minor, currency_code, verified_at), refunds(id, status, refund_amount_minor, currency_code, provider_limitation_flagged, created_at), cancellation_requests(id, status, reason, created_at)',
      )
      .eq('customer_user_id', req.authUser!.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json({ bookings: data ?? [] });
  } catch (err) {
    if (err instanceof ConfigurationRequiredError) {
      res.status(err.statusCode).json({ error: err.message, missingVars: err.missingVars });
      return;
    }
    res.status(500).json({ error: 'Unable to load customer bookings.' });
  }
});

bookingsRouter.post('/:id/cancel-request', requireAuth, async (req: AuthRequest, res) => {
  const bookingId = String(req.params.id);
  if (!z.string().uuid().safeParse(bookingId).success) {
    res.status(400).json({ error: 'Invalid booking identifier.' });
    return;
  }

  const parsed = z.object({ reason: z.string().min(5).max(800) }).safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Provide a cancellation reason (at least 5 characters).' });
    return;
  }

  try {
    const supabase = requireSupabaseAdmin();
    const userId = req.authUser!.id;

    const { data: booking } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', bookingId)
      .maybeSingle();

    if (!booking || booking.customer_user_id !== userId) {
      res.status(404).json({ error: 'Booking not found.' });
      return;
    }

    if (['cancelled', 'refunded', 'expired'].includes(booking.status)) {
      res.status(400).json({ error: `Booking is already ${booking.status}.` });
      return;
    }

    const { data: cancelReq, error } = await supabase
      .from('cancellation_requests')
      .insert({
        booking_id: booking.id,
        requested_by: userId,
        reason: sanitizePlainText(parsed.data.reason, 800),
      })
      .select('*')
      .single();

    if (error) throw error;

    await supabase
      .from('bookings')
      .update({ status: 'cancellation_requested' })
      .eq('id', booking.id);

    await supabase.from('booking_status_history').insert({
      booking_id: booking.id,
      previous_status: booking.status,
      new_status: 'cancellation_requested',
      changed_by: userId,
      reason: sanitizePlainText(parsed.data.reason, 800),
    });

    res.status(201).json({ cancellationRequest: cancelReq });
  } catch (err) {
    if (err instanceof ConfigurationRequiredError) {
      res.status(err.statusCode).json({ error: err.message, missingVars: err.missingVars });
      return;
    }
    res.status(500).json({ error: 'Unable to submit cancellation request.' });
  }
});
