import { Router } from 'express';
import { z } from 'zod';
import { recordAuditLog, sanitizePlainText } from '../lib/security.ts';
import { ConfigurationRequiredError, requireSupabaseAdmin } from '../lib/supabase.ts';
import { requireAuth, requireRoles, type AuthRequest } from '../middleware/auth.ts';

export const adminRouter = Router();

const verifySupplierSchema = z.object({
  verificationStatus: z.enum([
    'under_review',
    'additional_info_required',
    'approved',
    'rejected',
    'suspended',
  ]),
  notes: z.string().max(600).optional().default(''),
  beneficiaryEmail: z.string().email().optional(),
  providerBeneficiaryId: z.string().max(120).optional(),
  masterCommissionBps: z.number().int().min(0).max(5000).optional(),
});

const commissionRuleSchema = z.object({
  name: z.string().min(3).max(120),
  scopeType: z.enum(['global', 'category', 'supplier', 'experience', 'promotion']),
  categoryId: z.string().uuid().nullable().optional(),
  supplierId: z.string().uuid().nullable().optional(),
  experienceId: z.string().uuid().nullable().optional(),
  rateBps: z.number().int().min(0).max(5000),
  priority: z.number().int().min(1).max(1000).default(100),
  isDevelopmentSample: z.boolean().default(false),
});

function escapeCsvCell(value: unknown): string {
  const str = String(value ?? '');
  const formulaProtected = /^[=+\-@]/.test(str) ? `'${str}` : str;
  return `"${formulaProtected.replace(/"/g, '""')}"`;
}

adminRouter.get(
  '/overview',
  requireAuth,
  requireRoles(['operations', 'content_manager', 'finance', 'admin', 'super_admin']),
  async (_req, res) => {
    try {
      const supabase = requireSupabaseAdmin();

      const [suppliersRes, bookingsRes, rulesRes, refundsRes, ledgerRes, securityRes, auditRes] =
        await Promise.all([
          supabase
            .from('suppliers')
            .select('*, supplier_payment_accounts(*), supplier_beneficiary_arrangements(*), supplier_agreements(*)')
            .order('created_at', { ascending: false })
            .limit(100),
          supabase
            .from('bookings')
            .select('*, suppliers(trading_name), booking_commission_snapshots(*), payments(merchant_reference, provider_reference, status)')
            .order('created_at', { ascending: false })
            .limit(100),
          supabase.from('commission_rules').select('*').order('priority', { ascending: false }),
          supabase.from('refunds').select('*, bookings(booking_reference)').order('created_at', { ascending: false }),
          supabase
            .from('ledger_entries')
            .select('id, direction, amount_minor, currency_code, supplier_id, created_at, ledger_accounts(code, name, account_type)')
            .order('created_at', { ascending: false })
            .limit(200),
          supabase.from('security_events').select('*').order('created_at', { ascending: false }).limit(50),
          supabase.from('audit_logs').select('*').order('created_at', { ascending: false }).limit(50),
        ]);

      const ledgerTotalsByCurrency: Record<
        string,
        { commissionRevenueMinor: number; supplierClearingMinor: number; gatewayClearingMinor: number }
      > = {};

      for (const entry of ledgerRes.data ?? []) {
        const curr = String(entry.currency_code);
        if (!ledgerTotalsByCurrency[curr]) {
          ledgerTotalsByCurrency[curr] = {
            commissionRevenueMinor: 0,
            supplierClearingMinor: 0,
            gatewayClearingMinor: 0,
          };
        }
        const acct = entry.ledger_accounts as { code?: string } | null;
        const signed =
          entry.direction === 'credit'
            ? Number(entry.amount_minor)
            : -Number(entry.amount_minor);

        if (acct?.code === 'marketplace_commission_revenue') {
          ledgerTotalsByCurrency[curr].commissionRevenueMinor += signed;
        } else if (acct?.code === 'supplier_settlement_clearing') {
          ledgerTotalsByCurrency[curr].supplierClearingMinor += signed;
        } else if (acct?.code === 'gateway_clearing') {
          ledgerTotalsByCurrency[curr].gatewayClearingMinor += -signed;
        }
      }

      res.json({
        suppliers: suppliersRes.data ?? [],
        bookings: bookingsRes.data ?? [],
        commissionRules: rulesRes.data ?? [],
        refunds: refundsRes.data ?? [],
        ledgerEntries: ledgerRes.data ?? [],
        ledgerTotalsByCurrency,
        securityEvents: securityRes.data ?? [],
        auditLogs: auditRes.data ?? [],
      });
    } catch (err) {
      if (err instanceof ConfigurationRequiredError) {
        res.status(err.statusCode).json({ error: err.message, missingVars: err.missingVars });
        return;
      }
      res.status(500).json({ error: 'Unable to load administrative overview.' });
    }
  },
);

adminRouter.patch(
  '/suppliers/:id/verify',
  requireAuth,
  requireRoles(['operations', 'admin', 'super_admin'], { requireMfa: true }),
  async (req: AuthRequest, res) => {
    const supplierId = String(req.params.id);
    if (!z.string().uuid().safeParse(supplierId).success) {
      res.status(400).json({ error: 'Invalid supplier ID.' });
      return;
    }

    const parsed = verifySupplierSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Invalid verification payload', issues: parsed.error.issues });
      return;
    }

    try {
      const supabase = requireSupabaseAdmin();
      const actorId = req.authUser!.id;
      const input = parsed.data;

      const { data: supplier } = await supabase
        .from('suppliers')
        .select('*, supplier_agreements(id), supplier_payment_accounts(*)')
        .eq('id', supplierId)
        .maybeSingle();

      if (!supplier) {
        res.status(404).json({ error: 'Supplier not found.' });
        return;
      }

      const agreements = (supplier.supplier_agreements as unknown[]) ?? [];
      const payAccounts = (supplier.supplier_payment_accounts as Array<{ id: string; merchant_email: string }>) ?? [];

      if (input.verificationStatus === 'approved') {
        if (agreements.length === 0) {
          res.status(400).json({
            error: 'Supplier must accept the TRANSEND TOURS (PRIVATE) LIMITED supplier agreement before approval.',
          });
          return;
        }
        const targetEmail = input.beneficiaryEmail || payAccounts[0]?.merchant_email;
        if (!targetEmail || payAccounts.length === 0) {
          res.status(400).json({
            error: 'Supplier requires a verified Pesepay merchant payout email before approval.',
          });
          return;
        }

        await supabase
          .from('supplier_payment_accounts')
          .update({ payout_eligibility_verified: true, status: 'verified' })
          .eq('id', payAccounts[0].id);

        await supabase.from('supplier_beneficiary_arrangements').upsert(
          {
            supplier_id: supplier.id,
            payment_account_id: payAccounts[0].id,
            provider_code: 'pesepay',
            provider_beneficiary_id: input.providerBeneficiaryId || null,
            beneficiary_email: targetEmail.trim().toLowerCase(),
            master_commission_bps: input.masterCommissionBps ?? 1000,
            arrangement_status: 'active',
            approved_at: new Date().toISOString(),
            approved_by: actorId,
          },
          { onConflict: 'supplier_id,provider_code,settlement_currency' },
        );

        adminRouter.patch(
          '/suppliers/:id/operator-profile',
          requireAuth,
          requireRoles(['operations', 'content_manager', 'admin', 'super_admin'], { requireMfa: true }),
          async (req: AuthRequest, res) => {
            const supplierId = String(req.params.id);
            const parsed = z.object({
              directoryStatus: z.enum(['draft', 'submitted', 'published', 'suspended']),
              isFeatured: z.boolean().optional(),
            }).safeParse(req.body);
            if (!z.string().uuid().safeParse(supplierId).success) {
              res.status(400).json({ error: 'Invalid supplier ID.' });
              return;
            }
            if (!parsed.success) {
              res.status(400).json({ error: 'Invalid operator directory payload', issues: parsed.error.issues });
              return;
            }

            try {
              const supabase = requireSupabaseAdmin();
              const { data: supplier } = await supabase
                .from('suppliers')
                .select('id, verification_status')
                .eq('id', supplierId)
                .maybeSingle();
              if (!supplier) {
                res.status(404).json({ error: 'Supplier not found.' });
                return;
              }
              if (parsed.data.directoryStatus === 'published' && supplier.verification_status !== 'approved') {
                res.status(400).json({ error: 'Only approved suppliers may be published in the public directory.' });
                return;
              }

              const payload: Record<string, unknown> = { directory_status: parsed.data.directoryStatus };
              if (parsed.data.isFeatured !== undefined) payload.is_featured = parsed.data.isFeatured;
              const { data: profile, error } = await supabase
                .from('operator_profiles')
                .update(payload)
                .eq('supplier_id', supplierId)
                .select('*')
                .maybeSingle();
              if (error) throw error;
              if (!profile) {
                res.status(404).json({ error: 'Operator profile has not been created.' });
                return;
              }

              await recordAuditLog({
                actorUserId: req.authUser!.id,
                action: 'OPERATOR_DIRECTORY_STATUS_UPDATED',
                resourceType: 'operator_profile',
                resourceId: supplierId,
                afterState: payload,
                ipAddress: req.ip || null,
              });
              res.json({ profile });
            } catch (err) {
              if (err instanceof ConfigurationRequiredError) {
                res.status(err.statusCode).json({ error: err.message, missingVars: err.missingVars });
                return;
              }
              res.status(500).json({ error: 'Unable to update operator directory status.' });
            }
          },
        );
      }

      const canAcceptPaid = input.verificationStatus === 'approved';
      const { data: updated, error } = await supabase
        .from('suppliers')
        .update({
          verification_status: input.verificationStatus,
          can_accept_paid_bookings: canAcceptPaid,
        })
        .eq('id', supplier.id)
        .select('*')
        .single();

      if (error) throw error;

      await supabase.from('supplier_verification_records').insert({
        supplier_id: supplier.id,
        previous_status: supplier.verification_status,
        new_status: input.verificationStatus,
        reviewed_by: actorId,
        notes: sanitizePlainText(input.notes, 600) || null,
      });

      await supabase.from('administrative_actions').insert({
        admin_user_id: actorId,
        action_type: `SUPPLIER_${input.verificationStatus.toUpperCase()}`,
        target_type: 'supplier',
        target_id: supplier.id,
        justification: sanitizePlainText(input.notes, 600) || 'Compliance verification review',
        mfa_verified: req.authUser!.aal === 'aal2',
      });

      await recordAuditLog({
        actorUserId: actorId,
        action: 'SUPPLIER_VERIFICATION_UPDATED',
        resourceType: 'supplier',
        resourceId: supplier.id,
        beforeState: { verificationStatus: supplier.verification_status },
        afterState: { verificationStatus: input.verificationStatus, canAcceptPaid },
        ipAddress: req.ip || null,
      });

      res.json({ supplier: updated });
    } catch (err) {
      if (err instanceof ConfigurationRequiredError) {
        res.status(err.statusCode).json({ error: err.message, missingVars: err.missingVars });
        return;
      }
      res.status(500).json({ error: 'Unable to update supplier verification status.' });
    }
  },
);

adminRouter.post(
  '/commission-rules',
  requireAuth,
  requireRoles(['finance', 'admin', 'super_admin'], { requireMfa: true }),
  async (req: AuthRequest, res) => {
    const parsed = commissionRuleSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Invalid commission rule', issues: parsed.error.issues });
      return;
    }

    try {
      const supabase = requireSupabaseAdmin();
      const input = parsed.data;

      const { data, error } = await supabase
        .from('commission_rules')
        .insert({
          name: sanitizePlainText(input.name, 120),
          scope_type: input.scopeType,
          category_id: input.categoryId ?? null,
          supplier_id: input.supplierId ?? null,
          experience_id: input.experienceId ?? null,
          rate_bps: input.rateBps,
          priority: input.priority,
          is_development_sample: input.isDevelopmentSample,
          approved_by: req.authUser!.id,
        })
        .select('*')
        .single();

      if (error) throw error;

      await recordAuditLog({
        actorUserId: req.authUser!.id,
        action: 'COMMISSION_RULE_CREATED',
        resourceType: 'commission_rule',
        resourceId: data.id,
        afterState: { rateBps: data.rate_bps, scopeType: data.scope_type },
        ipAddress: req.ip || null,
      });

      res.status(201).json({ rule: data });
    } catch (err) {
      if (err instanceof ConfigurationRequiredError) {
        res.status(err.statusCode).json({ error: err.message, missingVars: err.missingVars });
        return;
      }
      res.status(500).json({ error: 'Unable to create commission rule.' });
    }
  },
);

adminRouter.get(
  '/ledger/export.csv',
  requireAuth,
  requireRoles(['finance', 'admin', 'super_admin']),
  async (_req, res) => {
    try {
      const supabase = requireSupabaseAdmin();
      const { data: entries, error } = await supabase
        .from('ledger_entries')
        .select(
          'id, direction, amount_minor, currency_code, supplier_id, created_at, ledger_accounts(code, name), ledger_journals(journal_reference, journal_type, provider_reference, booking_id)',
        )
        .order('created_at', { ascending: false })
        .limit(2000);

      if (error) throw error;

      const headers = [
        'entry_id',
        'posted_at',
        'journal_reference',
        'journal_type',
        'account_code',
        'account_name',
        'direction',
        'amount_minor',
        'currency_code',
        'supplier_id',
        'provider_reference',
      ];

      const lines = [headers.join(',')];
      for (const row of entries ?? []) {
        const acct = row.ledger_accounts as { code?: string; name?: string } | null;
        const journal = row.ledger_journals as {
          journal_reference?: string;
          journal_type?: string;
          provider_reference?: string;
        } | null;

        lines.push(
          [
            row.id,
            row.created_at,
            journal?.journal_reference ?? '',
            journal?.journal_type ?? '',
            acct?.code ?? '',
            acct?.name ?? '',
            row.direction,
            row.amount_minor,
            row.currency_code,
            row.supplier_id ?? '',
            journal?.provider_reference ?? '',
          ]
            .map(escapeCsvCell)
            .join(','),
        );
      }

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="transend-tours-ledger-${new Date().toISOString().slice(0, 10)}.csv"`,
      );
      res.send(lines.join('\n'));
    } catch (err) {
      if (err instanceof ConfigurationRequiredError) {
        res.status(err.statusCode).json({ error: err.message, missingVars: err.missingVars });
        return;
      }
      res.status(500).json({ error: 'Unable to export double-entry ledger.' });
    }
  },
);

adminRouter.post(
  '/reconcile',
  requireAuth,
  requireRoles(['finance', 'admin', 'super_admin'], { requireMfa: true }),
  async (req: AuthRequest, res) => {
    const parsed = z
      .object({
        currencyCode: z.enum(['USD', 'ZWG']).default('USD'),
      })
      .safeParse(req.body);

    if (!parsed.success) {
      res.status(400).json({ error: 'Invalid reconciliation parameters.' });
      return;
    }

    try {
      const supabase = requireSupabaseAdmin();
      const currencyCode = parsed.data.currencyCode;
      const today = new Date().toISOString().slice(0, 10);

      const [{ data: paidPayments }, { data: captureJournals }] = await Promise.all([
        supabase
          .from('payments')
          .select('id, merchant_reference, amount_minor, currency_code')
          .eq('status', 'succeeded')
          .eq('currency_code', currencyCode),
        supabase
          .from('ledger_journals')
          .select('payment_id')
          .eq('journal_type', 'payment_capture')
          .eq('currency_code', currencyCode),
      ]);

      const capturedIds = new Set((captureJournals ?? []).map((j) => j.payment_id));
      const discrepancies: Array<{
        payment_id: string;
        discrepancy_type: string;
        expected_minor: number;
        observed_minor: number;
        currency_code: string;
        notes: string;
      }> = [];

      let matchedCount = 0;
      for (const p of paidPayments ?? []) {
        if (capturedIds.has(p.id)) {
          matchedCount += 1;
        } else {
          discrepancies.push({
            payment_id: p.id,
            discrepancy_type: 'MISSING_LEDGER_CAPTURE_JOURNAL',
            expected_minor: Number(p.amount_minor),
            observed_minor: 0,
            currency_code: currencyCode,
            notes: `Succeeded payment ${p.merchant_reference} lacks a matching ledger capture journal.`,
          });
        }
      }

      const { data: run, error: runErr } = await supabase
        .from('reconciliation_runs')
        .insert({
          provider_code: 'pesepay',
          run_by: req.authUser!.id,
          period_start: today,
          period_end: today,
          currency_code: currencyCode,
          matched_count: matchedCount,
          discrepancy_count: discrepancies.length,
          status: 'completed',
        })
        .select('*')
        .single();

      if (runErr) throw runErr;

      if (discrepancies.length > 0) {
        await supabase.from('reconciliation_discrepancies').insert(
          discrepancies.map((d) => ({
            ...d,
            reconciliation_run_id: run.id,
          })),
        );
      }

      res.json({ run, discrepancies });
    } catch (err) {
      if (err instanceof ConfigurationRequiredError) {
        res.status(err.statusCode).json({ error: err.message, missingVars: err.missingVars });
        return;
      }
      res.status(500).json({ error: 'Unable to complete reconciliation run.' });
    }
  },
);
