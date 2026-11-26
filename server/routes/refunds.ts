import { Router } from 'express';
import { z } from 'zod';
import { getServerConfig } from '../lib/config.ts';
import { recordAuditLog, recordSecurityEvent, sanitizePlainText } from '../lib/security.ts';
import { ConfigurationRequiredError, requireSupabaseAdmin } from '../lib/supabase.ts';
import { requireAuth, requireRoles, type AuthRequest } from '../middleware/auth.ts';
import { pesepayAdapter } from '../payments/pesepayAdapter.ts';
import { buildRefundReversalJournalLines } from '../services/ledger.ts';

export const refundsRouter = Router();

const requestRefundSchema = z.object({
  bookingId: z.string().uuid(),
  refundType: z.enum(['full', 'partial']),
  refundAmountMinor: z.number().int().positive(),
  reason: z.string().min(5).max(800),
  idempotencyKey: z.string().min(8).max(128),
});

const transitionSchema = z.object({
  targetStatus: z.enum(['UNDER_REVIEW', 'APPROVED', 'PROCESSING', 'SUCCEEDED', 'REJECTED', 'CANCELLED']),
  notes: z.string().max(600).optional().default(''),
});

const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  REQUESTED: ['UNDER_REVIEW', 'APPROVED', 'REJECTED', 'CANCELLED'],
  UNDER_REVIEW: ['APPROVED', 'REJECTED', 'CANCELLED'],
  APPROVED: ['PROCESSING', 'REJECTED'],
  PROCESSING: ['SUCCEEDED', 'FAILED'],
};

export function calculateProRataReversal(params: {
  refundAmountMinor: number;
  totalPaidMinor: number;
  commissionAmountMinor: number;
}) {
  if (params.refundAmountMinor > params.totalPaidMinor || params.refundAmountMinor <= 0) {
    throw new Error('Refund amount exceeds original captured payment amount.');
  }
  const commissionReversalBig =
    (BigInt(params.commissionAmountMinor) * BigInt(params.refundAmountMinor) +
      BigInt(params.totalPaidMinor) / 2n) /
    BigInt(params.totalPaidMinor);
  const commissionReversalMinor = Number(commissionReversalBig);
  const supplierReversalMinor = params.refundAmountMinor - commissionReversalMinor;
  return { commissionReversalMinor, supplierReversalMinor };
}

refundsRouter.post('/request', requireAuth, async (req: AuthRequest, res) => {
  const parsed = requestRefundSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid refund request', issues: parsed.error.issues });
    return;
  }

  try {
    const supabase = requireSupabaseAdmin();
    const cfg = getServerConfig();
    const userId = req.authUser!.id;
    const input = parsed.data;

    const { data: existing } = await supabase
      .from('refunds')
      .select('*')
      .eq('idempotency_key', input.idempotencyKey)
      .maybeSingle();

    if (existing) {
      res.json({ refund: existing });
      return;
    }

    const { data: booking } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', input.bookingId)
      .maybeSingle();

    const isPrivileged = req.authUser!.roles.some((r) =>
      ['finance', 'admin', 'super_admin'].includes(r),
    );
    if (!booking || (!isPrivileged && booking.customer_user_id !== userId)) {
      res.status(404).json({ error: 'Booking not found.' });
      return;
    }

    if (booking.payment_status !== 'paid') {
      res.status(400).json({ error: 'Only verified paid bookings are eligible for refund requests.' });
      return;
    }

    const { data: payment } = await supabase
      .from('payments')
      .select('*')
      .eq('booking_id', booking.id)
      .eq('status', 'succeeded')
      .limit(1)
      .maybeSingle();

    if (!payment) {
      res.status(400).json({ error: 'No verified captured payment found for this booking.' });
      return;
    }

    if (input.refundType === 'full' && input.refundAmountMinor !== Number(payment.amount_minor)) {
      res.status(400).json({ error: 'Full refund amount must match exact captured payment amount.' });
      return;
    }

    const { commissionReversalMinor, supplierReversalMinor } = calculateProRataReversal({
      refundAmountMinor: input.refundAmountMinor,
      totalPaidMinor: Number(payment.amount_minor),
      commissionAmountMinor: Number(payment.expected_commission_minor),
    });

    const { data: refundRow, error } = await supabase
      .from('refunds')
      .insert({
        booking_id: booking.id,
        payment_id: payment.id,
        requested_by: userId,
        refund_type: input.refundType,
        currency_code: payment.currency_code,
        refund_amount_minor: input.refundAmountMinor,
        commission_reversal_minor: commissionReversalMinor,
        supplier_reversal_minor: supplierReversalMinor,
        reason: sanitizePlainText(input.reason, 800),
        status: 'REQUESTED',
        provider_limitation_flagged: !cfg.pesepaySplitRefundsVerified,
        idempotency_key: input.idempotencyKey,
      })
      .select('*')
      .single();

    if (error) throw error;

    await supabase.from('refund_events').insert({
      refund_id: refundRow.id,
      previous_status: null,
      new_status: 'REQUESTED',
      actor_user_id: userId,
      notes: cfg.pesepaySplitRefundsVerified
        ? 'Refund request submitted'
        : 'Refund request submitted (flagged: Pesepay split refund reversal rules awaiting verification)',
    });

    res.status(201).json({ refund: refundRow });
  } catch (err) {
    if (err instanceof ConfigurationRequiredError) {
      res.status(err.statusCode).json({ error: err.message, missingVars: err.missingVars });
      return;
    }
    res.status(400).json({ error: err instanceof Error ? err.message : 'Unable to submit refund request.' });
  }
});

refundsRouter.post(
  '/:id/transition',
  requireAuth,
  requireRoles(['finance', 'admin', 'super_admin'], { requireMfa: true }),
  async (req: AuthRequest, res) => {
    const refundId = String(req.params.id);
    if (!z.string().uuid().safeParse(refundId).success) {
      res.status(400).json({ error: 'Invalid refund identifier.' });
      return;
    }

    const parsed = transitionSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Invalid refund state transition request.' });
      return;
    }

    try {
      const supabase = requireSupabaseAdmin();
      const cfg = getServerConfig();
      const actorId = req.authUser!.id;
      const { targetStatus, notes } = parsed.data;

      const { data: refund } = await supabase
        .from('refunds')
        .select('*, bookings(supplier_id, booking_reference), payments(provider_reference)')
        .eq('id', refundId)
        .maybeSingle();

      if (!refund) {
        res.status(404).json({ error: 'Refund record not found.' });
        return;
      }

      const allowedNext = ALLOWED_TRANSITIONS[refund.status] ?? [];
      if (!allowedNext.includes(targetStatus)) {
        res.status(400).json({
          error: `Illegal refund transition from ${refund.status} to ${targetStatus}.`,
        });
        return;
      }

      if (
        (targetStatus === 'PROCESSING' || targetStatus === 'SUCCEEDED') &&
        !cfg.pesepaySplitRefundsVerified
      ) {
        await recordSecurityEvent({
          userId: actorId,
          severity: 'medium',
          eventCode: 'UNVERIFIED_SPLIT_REFUND_BLOCKED',
          summary: `Blocked live split refund execution on ${refund.id} because PESEPAY_SPLIT_REFUNDS_VERIFIED is false`,
          ipAddress: req.ip || null,
        });
        res.status(409).json({
          error:
            'Split-payment live refund execution is disabled until Pesepay confirms master/beneficiary reversal rules (PESEPAY_SPLIT_REFUNDS_VERIFIED=true).',
        });
        return;
      }

      if (targetStatus === 'PROCESSING') {
        const paymentObj = refund.payments as { provider_reference?: string } | null;
        await pesepayAdapter.refundTransaction({
          providerReference: paymentObj?.provider_reference || '',
          amountMinor: Number(refund.refund_amount_minor),
          currencyCode: refund.currency_code,
          reason: refund.reason,
          refundType: refund.refund_type,
        });
      }

      if (targetStatus === 'SUCCEEDED') {
        const bookingObj = refund.bookings as { supplier_id: string; booking_reference: string } | null;
        if (!bookingObj) throw new Error('Booking missing on refund.');

        const lines = buildRefundReversalJournalLines({
          refundAmountMinor: Number(refund.refund_amount_minor),
          commissionReversalMinor: Number(refund.commission_reversal_minor),
          supplierReversalMinor: Number(refund.supplier_reversal_minor),
          currencyCode: refund.currency_code,
          supplierId: bookingObj.supplier_id,
        });

        await supabase.rpc('post_balanced_ledger_journal', {
          p_journal_reference: `REV-${refund.id.slice(0, 8).toUpperCase()}`,
          p_journal_type: 'refund_reversal',
          p_currency_code: refund.currency_code,
          p_booking_id: refund.booking_id,
          p_payment_id: refund.payment_id,
          p_refund_id: refund.id,
          p_provider_reference: refund.provider_refund_reference ?? null,
          p_description: `Verified refund reversal for booking ${bookingObj.booking_reference}`,
          p_posted_by: actorId,
          p_lines: lines.map((l) => ({
            account_code: l.accountCode,
            direction: l.direction,
            amount_minor: l.amountMinor,
            supplier_id: l.supplierId ?? '',
          })),
        });

        await supabase
          .from('bookings')
          .update({
            status: refund.refund_type === 'full' ? 'refunded' : 'confirmed',
            payment_status: refund.refund_type === 'full' ? 'refunded' : 'partially_refunded',
          })
          .eq('id', refund.booking_id);
      }

      const { data: updated, error: updErr } = await supabase
        .from('refunds')
        .update({
          status: targetStatus,
          approved_by: targetStatus === 'APPROVED' ? actorId : refund.approved_by,
        })
        .eq('id', refund.id)
        .select('*')
        .single();

      if (updErr) throw updErr;

      await supabase.from('refund_events').insert({
        refund_id: refund.id,
        previous_status: refund.status,
        new_status: targetStatus,
        actor_user_id: actorId,
        notes: sanitizePlainText(notes, 600) || `Transitioned to ${targetStatus}`,
      });

      await recordAuditLog({
        actorUserId: actorId,
        action: `REFUND_${targetStatus}`,
        resourceType: 'refund',
        resourceId: refund.id,
        beforeState: { status: refund.status },
        afterState: { status: targetStatus },
        ipAddress: req.ip || null,
      });

      res.json({ refund: updated });
    } catch (err) {
      if (err instanceof ConfigurationRequiredError) {
        res.status(err.statusCode).json({ error: err.message, missingVars: err.missingVars });
        return;
      }
      res.status(400).json({ error: err instanceof Error ? err.message : 'Unable to transition refund.' });
    }
  },
);
