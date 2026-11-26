import crypto from 'node:crypto';
import { Router } from 'express';
import { z } from 'zod';
import { getServerConfig, isPesepayConfigured } from '../lib/config.ts';
import { recordAuditLog, recordSecurityEvent } from '../lib/security.ts';
import { ConfigurationRequiredError, requireSupabaseAdmin } from '../lib/supabase.ts';
import { requireAuth, type AuthRequest } from '../middleware/auth.ts';
import { pesepayAdapter } from '../payments/pesepayAdapter.ts';
import { buildPaymentCaptureJournalLines } from '../services/ledger.ts';

export const paymentsRouter = Router();

const initiateSchema = z.object({
  bookingId: z.string().uuid(),
  idempotencyKey: z.string().min(8).max(128),
});

async function finalizeVerifiedPayment(params: {
  paymentRow: {
    id: string;
    booking_id: string;
    merchant_reference: string;
    provider_reference: string | null;
    currency_code: string;
    amount_minor: number;
    expected_commission_minor: number;
    expected_supplier_share_minor: number;
    beneficiary_merchant_email: string;
    status: string;
  };
  verified: Awaited<ReturnType<typeof pesepayAdapter.verifyTransaction>>;
  actorUserId?: string | null;
  ipAddress?: string | null;
}) {
  const supabase = requireSupabaseAdmin();
  const { paymentRow, verified } = params;

  // Validate critical anti-tampering invariants
  if (
    verified.merchantReference &&
    verified.merchantReference !== paymentRow.merchant_reference
  ) {
    await recordSecurityEvent({
      userId: params.actorUserId ?? null,
      severity: 'critical',
      eventCode: 'PAYMENT_REFERENCE_MISMATCH',
      summary: `Pesepay merchantReference mismatch for ${paymentRow.merchant_reference}`,
      ipAddress: params.ipAddress ?? null,
      metadata: {
        expected: paymentRow.merchant_reference,
        observed: verified.merchantReference,
      },
    });
    await supabase
      .from('payments')
      .update({ status: 'verification_mismatch' })
      .eq('id', paymentRow.id);
    throw new Error('Payment merchant reference verification mismatch.');
  }

  if (
    verified.amountMinor !== Number(paymentRow.amount_minor) ||
    verified.currencyCode !== String(paymentRow.currency_code)
  ) {
    await recordSecurityEvent({
      userId: params.actorUserId ?? null,
      severity: 'critical',
      eventCode: 'PAYMENT_AMOUNT_CURRENCY_MISMATCH',
      summary: `Pesepay amount/currency mismatch on payment ${paymentRow.merchant_reference}`,
      ipAddress: params.ipAddress ?? null,
      metadata: {
        expectedAmount: paymentRow.amount_minor,
        observedAmount: verified.amountMinor,
        expectedCurrency: paymentRow.currency_code,
        observedCurrency: verified.currencyCode,
      },
    });
    await supabase
      .from('payments')
      .update({ status: 'verification_mismatch' })
      .eq('id', paymentRow.id);
    throw new Error('Verified payment amount or currency does not match booking.');
  }

  if (
    verified.beneficiaryMerchantEmail &&
    verified.beneficiaryMerchantEmail.toLowerCase() !==
      paymentRow.beneficiary_merchant_email.toLowerCase()
  ) {
    await recordSecurityEvent({
      userId: params.actorUserId ?? null,
      severity: 'critical',
      eventCode: 'PAYMENT_BENEFICIARY_MISMATCH',
      summary: `Pesepay beneficiary mismatch on ${paymentRow.merchant_reference}`,
      ipAddress: params.ipAddress ?? null,
      metadata: {
        expected: paymentRow.beneficiary_merchant_email,
        observed: verified.beneficiaryMerchantEmail,
      },
    });
    await supabase
      .from('payments')
      .update({ status: 'verification_mismatch' })
      .eq('id', paymentRow.id);
    throw new Error('Verified beneficiary email mismatch.');
  }

  if (!verified.paid) {
    if (verified.transactionStatus === 'FAILED' || verified.transactionStatus === 'CANCELLED') {
      await supabase.from('payments').update({ status: 'failed' }).eq('id', paymentRow.id);
      await supabase
        .from('bookings')
        .update({ payment_status: 'failed', status: 'failed' })
        .eq('id', paymentRow.booking_id);
    }
    return { confirmed: false, transactionStatus: verified.transactionStatus };
  }

  if (paymentRow.status === 'succeeded') {
    return { confirmed: true, transactionStatus: 'SUCCESS' };
  }

  const { data: booking } = await supabase
    .from('bookings')
    .select('id, supplier_id, customer_user_id, booking_reference, status, booking_items(*), booking_commission_snapshots(*)')
    .eq('id', paymentRow.booking_id)
    .single();

  if (!booking) throw new Error('Associated booking missing during settlement.');

  // Record verified provider transaction
  await supabase.from('provider_transactions').upsert(
    {
      payment_id: paymentRow.id,
      provider_code: 'pesepay',
      provider_reference: verified.providerReference,
      transaction_status: verified.transactionStatus,
      amount_minor: verified.amountMinor,
      currency_code: verified.currencyCode,
      payment_method_used: verified.paymentMethodUsed ?? null,
      verified_payload: verified.rawPayload,
    },
    { onConflict: 'provider_reference' },
  );

  // Record split allocation & expected settlement
  const { data: arrangement } = await supabase
    .from('supplier_beneficiary_arrangements')
    .select('id')
    .eq('supplier_id', booking.supplier_id)
    .eq('provider_code', 'pesepay')
    .eq('arrangement_status', 'active')
    .maybeSingle();

  const { data: splitRecord } = await supabase
    .from('provider_split_records')
    .insert({
      payment_id: paymentRow.id,
      supplier_id: booking.supplier_id,
      beneficiary_arrangement_id: arrangement?.id ?? null,
      beneficiary_merchant_email: paymentRow.beneficiary_merchant_email,
      currency_code: paymentRow.currency_code,
      master_commission_minor: paymentRow.expected_commission_minor,
      beneficiary_share_minor: paymentRow.expected_supplier_share_minor,
      split_status: 'allocated',
    })
    .select('id')
    .single();

  await supabase.from('supplier_settlement_records').insert({
    supplier_id: booking.supplier_id,
    payment_id: paymentRow.id,
    split_record_id: splitRecord?.id ?? null,
    beneficiary_merchant_email: paymentRow.beneficiary_merchant_email,
    currency_code: paymentRow.currency_code,
    expected_supplier_share_minor: paymentRow.expected_supplier_share_minor,
    settlement_stage: 'expected_split',
  });

  // Post immutable balanced double-entry ledger journal
  const snapshotRow = Array.isArray(booking.booking_commission_snapshots)
    ? booking.booking_commission_snapshots[0]
    : booking.booking_commission_snapshots;
  const taxMinor = Number(snapshotRow?.tax_minor ?? 0);

  const journalLines = buildPaymentCaptureJournalLines({
    grossPaidMinor: Number(paymentRow.amount_minor),
    commissionAmountMinor: Number(paymentRow.expected_commission_minor),
    supplierShareMinor: Number(paymentRow.expected_supplier_share_minor),
    taxMinor,
    currencyCode: paymentRow.currency_code,
    supplierId: booking.supplier_id,
  });

  const rpcLines = journalLines.map((line) => ({
    account_code: line.accountCode,
    direction: line.direction,
    amount_minor: line.amountMinor,
    supplier_id: line.supplierId ?? '',
  }));

  const { error: journalErr } = await supabase.rpc('post_balanced_ledger_journal', {
    p_journal_reference: `CAP-${paymentRow.merchant_reference}`,
    p_journal_type: 'payment_capture',
    p_currency_code: paymentRow.currency_code,
    p_booking_id: booking.id,
    p_payment_id: paymentRow.id,
    p_refund_id: null,
    p_provider_reference: verified.providerReference,
    p_description: `Pesepay split payment capture for booking ${booking.booking_reference}`,
    p_posted_by: params.actorUserId ?? null,
    p_lines: rpcLines,
  });

  if (journalErr) throw journalErr;

  // Convert inventory holds into confirmed capacity
  for (const item of booking.booking_items ?? []) {
    if (item.reservation_id) {
      await supabase
        .from('inventory_reservations')
        .update({ status: 'converted_to_booking' })
        .eq('id', item.reservation_id)
        .eq('status', 'active');
    }
    if (item.availability_slot_id) {
      const { data: slot } = await supabase
        .from('availability_slots')
        .select('id, reserved_capacity, confirmed_capacity')
        .eq('id', item.availability_slot_id)
        .maybeSingle();
      if (slot) {
        await supabase
          .from('availability_slots')
          .update({
            reserved_capacity: Math.max(0, Number(slot.reserved_capacity) - Number(item.quantity)),
            confirmed_capacity: Number(slot.confirmed_capacity) + Number(item.quantity),
          })
          .eq('id', slot.id);
      }
    }
  }

  await supabase
    .from('payments')
    .update({
      status: 'succeeded',
      provider_reference: verified.providerReference,
      verified_at: new Date().toISOString(),
    })
    .eq('id', paymentRow.id);

  await supabase
    .from('bookings')
    .update({
      status: 'confirmed',
      payment_status: 'paid',
      settlement_reconciliation_status: 'split_allocated',
    })
    .eq('id', booking.id);

  await supabase.from('booking_status_history').insert({
    booking_id: booking.id,
    previous_status: booking.status,
    new_status: 'confirmed',
    changed_by: params.actorUserId ?? null,
    reason: `Confirmed via verified Pesepay check-payment (${verified.providerReference})`,
  });

  await recordAuditLog({
    actorUserId: params.actorUserId ?? null,
    action: 'PAYMENT_VERIFIED_AND_BOOKING_CONFIRMED',
    resourceType: 'payment',
    resourceId: paymentRow.id,
    afterState: {
      bookingReference: booking.booking_reference,
      providerReference: verified.providerReference,
      amountMinor: paymentRow.amount_minor,
      currencyCode: paymentRow.currency_code,
    },
    ipAddress: params.ipAddress ?? null,
  });

  return { confirmed: true, transactionStatus: 'SUCCESS' };
}

paymentsRouter.post('/pesepay/initiate', requireAuth, async (req: AuthRequest, res) => {
  const parsed = initiateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid payment initiation request', issues: parsed.error.issues });
    return;
  }

  try {
    if (!isPesepayConfigured()) {
      throw new ConfigurationRequiredError(
        'Pesepay merchant credentials (PESEPAY_INTEGRATION_KEY and 32-char PESEPAY_ENCRYPTION_KEY) are required to initiate payments.',
        ['PESEPAY_INTEGRATION_KEY', 'PESEPAY_ENCRYPTION_KEY'],
      );
    }

    const supabase = requireSupabaseAdmin();
    const cfg = getServerConfig();
    const userId = req.authUser!.id;

    // Idempotent lookup
    const { data: existingPayment } = await supabase
      .from('payments')
      .select('*, payment_attempts(*)')
      .eq('idempotency_key', parsed.data.idempotencyKey)
      .maybeSingle();

    if (existingPayment) {
      const attempt = existingPayment.payment_attempts?.[0];
      res.json({
        payment: existingPayment,
        redirectUrl: attempt?.redirect_url ?? null,
      });
      return;
    }

    const { data: booking } = await supabase
      .from('bookings')
      .select('*, suppliers(trading_name, verification_status, can_accept_paid_bookings), booking_commission_snapshots(*)')
      .eq('id', parsed.data.bookingId)
      .maybeSingle();

    if (!booking || booking.customer_user_id !== userId) {
      res.status(404).json({ error: 'Booking not found.' });
      return;
    }

    if (booking.payment_status === 'paid') {
      res.status(400).json({ error: 'Booking has already been paid and verified.' });
      return;
    }

    if (
      !booking.suppliers?.can_accept_paid_bookings ||
      booking.suppliers?.verification_status !== 'approved'
    ) {
      res.status(403).json({ error: 'Supplier is not approved to accept paid split bookings.' });
      return;
    }

    const { data: beneficiary } = await supabase
      .from('supplier_beneficiary_arrangements')
      .select('beneficiary_email')
      .eq('supplier_id', booking.supplier_id)
      .eq('provider_code', 'pesepay')
      .eq('arrangement_status', 'active')
      .maybeSingle();

    if (!beneficiary?.beneficiary_email) {
      res.status(400).json({ error: 'Active supplier Pesepay beneficiary arrangement missing.' });
      return;
    }

    const snapshot = Array.isArray(booking.booking_commission_snapshots)
      ? booking.booking_commission_snapshots[0]
      : booking.booking_commission_snapshots;

    if (!snapshot) {
      res.status(500).json({ error: 'Booking commission snapshot missing.' });
      return;
    }

    const merchantReference = `PAY-${booking.booking_reference}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;

    const { data: paymentRow, error: payErr } = await supabase
      .from('payments')
      .insert({
        booking_id: booking.id,
        provider_code: 'pesepay',
        merchant_reference: merchantReference,
        currency_code: booking.currency_code,
        amount_minor: booking.total_amount_minor,
        expected_commission_minor: snapshot.commission_amount_minor,
        expected_supplier_share_minor: snapshot.supplier_share_minor,
        beneficiary_merchant_email: beneficiary.beneficiary_email,
        status: 'initiated',
        idempotency_key: parsed.data.idempotencyKey,
      })
      .select('*')
      .single();

    if (payErr) throw payErr;

    const returnUrlWithRef = `${cfg.pesepayReturnUrl}?merchantReference=${encodeURIComponent(merchantReference)}`;

    const initiated = await pesepayAdapter.initiatePayment({
      merchantReference,
      amountMinor: Number(booking.total_amount_minor),
      currencyCode: booking.currency_code,
      reasonForPayment: `Transend Tours Booking ${booking.booking_reference}`,
      beneficiaryMerchantEmail: beneficiary.beneficiary_email,
      resultUrl: cfg.pesepayResultUrl,
      returnUrl: returnUrlWithRef,
    });

    await supabase.from('payment_attempts').insert({
      payment_id: paymentRow.id,
      attempt_number: 1,
      redirect_url: initiated.redirectUrl,
      poll_url: initiated.pollUrl,
      provider_reference: initiated.providerReference,
      request_metadata: {
        beneficiaryMerchantEmail: beneficiary.beneficiary_email,
        environment: cfg.pesepayEnv,
      },
      response_summary: initiated.rawSummary,
      status: 'redirected',
    });

    await supabase
      .from('payments')
      .update({
        provider_reference: initiated.providerReference,
        status: 'pending_customer',
      })
      .eq('id', paymentRow.id);

    await supabase
      .from('bookings')
      .update({ status: 'awaiting_verification', payment_status: 'pending' })
      .eq('id', booking.id);

    res.json({
      payment: {
        ...paymentRow,
        provider_reference: initiated.providerReference,
        status: 'pending_customer',
      },
      redirectUrl: initiated.redirectUrl,
    });
  } catch (err) {
    if (err instanceof ConfigurationRequiredError) {
      res.status(err.statusCode).json({ error: err.message, missingVars: err.missingVars });
      return;
    }
    res.status(500).json({ error: err instanceof Error ? err.message : 'Unable to initiate Pesepay checkout.' });
  }
});

paymentsRouter.post('/pesepay/result', async (req, res) => {
  try {
    const supabase = requireSupabaseAdmin();
    let decoded: Record<string, unknown>;

    try {
      decoded = pesepayAdapter.parseCallbackPayload(req.body);
    } catch (err) {
      await recordSecurityEvent({
        severity: 'high',
        eventCode: 'INVALID_PAYMENT_CALLBACK_PAYLOAD',
        summary: 'Rejected Pesepay callback that failed AES-256-CBC payload decryption',
        ipAddress: req.ip || null,
      });
      res.status(400).json({ error: err instanceof Error ? err.message : 'Invalid encrypted payload.' });
      return;
    }

    const providerRef = String(decoded.referenceNumber || '');
    const merchantRef = String(decoded.merchantReference || '');

    if (!providerRef && !merchantRef) {
      res.status(400).json({ error: 'Callback missing referenceNumber and merchantReference.' });
      return;
    }

    const { data: paymentRow } = await supabase
      .from('payments')
      .select('*')
      .or(
        providerRef && merchantRef
          ? `provider_reference.eq.${providerRef},merchant_reference.eq.${merchantRef}`
          : providerRef
            ? `provider_reference.eq.${providerRef}`
            : `merchant_reference.eq.${merchantRef}`,
      )
      .maybeSingle();

    if (!paymentRow) {
      await recordSecurityEvent({
        severity: 'high',
        eventCode: 'UNKNOWN_PAYMENT_CALLBACK_REFERENCE',
        summary: `Received Pesepay callback for unknown reference ${merchantRef || providerRef}`,
        ipAddress: req.ip || null,
      });
      res.status(404).json({ error: 'Unknown payment reference.' });
      return;
    }

    const eventKey = `pesepay:${providerRef || merchantRef}:${String(decoded.transactionStatus || 'EVENT')}`;

    const { error: evtErr } = await supabase.from('payment_events').insert({
      payment_id: paymentRow.id,
      provider_code: 'pesepay',
      provider_event_key: eventKey,
      event_type: String(decoded.transactionStatus || 'CALLBACK'),
      signature_valid: true,
      independent_check_verified: false,
      raw_payload: decoded,
    });

    if (evtErr && evtErr.code === '23505') {
      res.json({ ok: true, idempotentDuplicate: true });
      return;
    }

    // Independently verify status directly with Pesepay check-payment API before any state change
    const verified = await pesepayAdapter.verifyTransaction(
      providerRef || paymentRow.provider_reference,
    );

    await supabase
      .from('payment_events')
      .update({
        independent_check_verified: true,
        processed_at: new Date().toISOString(),
      })
      .eq('provider_event_key', eventKey);

    const outcome = await finalizeVerifiedPayment({
      paymentRow,
      verified,
      ipAddress: req.ip || null,
    });

    res.json({ ok: true, ...outcome });
  } catch (err) {
    if (err instanceof ConfigurationRequiredError) {
      res.status(err.statusCode).json({ error: err.message });
      return;
    }
    console.error('Pesepay result handler error:', err);
    res.status(500).json({ error: 'Callback verification error.' });
  }
});

paymentsRouter.get('/:merchantReference/status', requireAuth, async (req: AuthRequest, res) => {
  const merchantRef = String(req.params.merchantReference);
  try {
    const supabase = requireSupabaseAdmin();
    const { data: paymentRow } = await supabase
      .from('payments')
      .select('*, bookings(id, booking_reference, customer_user_id, status, payment_status)')
      .eq('merchant_reference', merchantRef)
      .maybeSingle();

    if (!paymentRow) {
      res.status(404).json({ error: 'Payment reference not found.' });
      return;
    }

    const booking = paymentRow.bookings as {
      id: string;
      booking_reference: string;
      customer_user_id: string;
      status: string;
      payment_status: string;
    } | null;

    const isPrivileged = req.authUser!.roles.some((r) =>
      ['finance', 'admin', 'super_admin', 'operations'].includes(r),
    );
    if (!isPrivileged && booking?.customer_user_id !== req.authUser!.id) {
      res.status(403).json({ error: 'Access denied for this payment reference.' });
      return;
    }

    if (
      paymentRow.status !== 'succeeded' &&
      paymentRow.provider_reference &&
      isPesepayConfigured()
    ) {
      try {
        const verified = await pesepayAdapter.verifyTransaction(paymentRow.provider_reference);
        if (verified.paid) {
          await finalizeVerifiedPayment({
            paymentRow,
            verified,
            actorUserId: req.authUser!.id,
            ipAddress: req.ip || null,
          });
        }
      } catch {
        // Return persisted status gracefully if upstream poll temporarily fails
      }
    }

    const { data: refreshed } = await supabase
      .from('payments')
      .select('*, bookings(id, booking_reference, status, payment_status)')
      .eq('merchant_reference', merchantRef)
      .single();

    res.json({ payment: refreshed });
  } catch (err) {
    if (err instanceof ConfigurationRequiredError) {
      res.status(err.statusCode).json({ error: err.message, missingVars: err.missingVars });
      return;
    }
    res.status(500).json({ error: 'Unable to check payment verification status.' });
  }
});
