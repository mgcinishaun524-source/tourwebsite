import { describe, expect, it } from 'vitest';
import {
  calculateCommissionSnapshot,
  selectEffectiveCommissionRule,
} from '../server/services/commission.ts';
import {
  buildPaymentCaptureJournalLines,
  buildRefundReversalJournalLines,
  validateBalancedJournalLines,
} from '../server/services/ledger.ts';
import { PesepayAdapter } from '../server/payments/pesepayAdapter.ts';
import { sanitizePlainText, isValidHttpUrl } from '../server/lib/security.ts';
import { calculateProRataReversal } from '../server/routes/refunds.ts';
import { formatMinorCurrency, parseMajorToMinor } from '../src/lib/money.ts';

describe('Transend Tours Marketplace Core Financial & Security Invariants', () => {
  it('computes deterministic BigInt basis-point commission snapshots without float drift', () => {
    const snap = calculateCommissionSnapshot({
      unitPriceMinor: 19999, // USD 199.99
      quantity: 3,
      rateBps: 1250, // 12.50%
      currencyCode: 'USD',
    });

    expect(snap.grossAmountMinor).toBe(59997);
    expect(snap.commissionAmountMinor + snap.supplierShareMinor).toBe(59997);
    // 59997 * 1250 / 10000 = 7499.625 -> half-up = 7500
    expect(snap.commissionAmountMinor).toBe(7500);
    expect(snap.supplierShareMinor).toBe(52497);
  });

  it('rejects negative values, floating-point money inputs, and excessive commission rates', () => {
    expect(() =>
      calculateCommissionSnapshot({
        unitPriceMinor: 100.5,
        quantity: 1,
        rateBps: 1000,
        currencyCode: 'USD',
      }),
    ).toThrow();

    expect(() =>
      calculateCommissionSnapshot({
        unitPriceMinor: 10000,
        quantity: 1,
        rateBps: 6000,
        currencyCode: 'USD',
      }),
    ).toThrow();
  });

  it('selects highest precedence commission rule (promotion > experience > supplier > category > global)', () => {
    const selected = selectEffectiveCommissionRule([
      { id: 'r-global', scopeType: 'global', rateBps: 1000, priority: 100 },
      { id: 'r-cat', scopeType: 'category', rateBps: 1200, priority: 200 },
      { id: 'r-sup', scopeType: 'supplier', rateBps: 950, priority: 50 },
    ]);
    expect(selected?.id).toBe('r-sup');
  });

  it('enforces balanced double-entry journals and strict single-currency isolation', () => {
    const lines = buildPaymentCaptureJournalLines({
      grossPaidMinor: 25000,
      commissionAmountMinor: 2500,
      supplierShareMinor: 22500,
      currencyCode: 'USD',
      supplierId: 'sup-1',
    });

    const summary = validateBalancedJournalLines(lines, 'USD');
    expect(summary.totalDebitsMinor).toBe(25000);
    expect(summary.totalCreditsMinor).toBe(25000);

    expect(() =>
      validateBalancedJournalLines(
        [
          { accountCode: 'gateway_clearing', direction: 'debit', amountMinor: 10000, currencyCode: 'USD' },
          { accountCode: 'marketplace_commission_revenue', direction: 'credit', amountMinor: 10000, currencyCode: 'ZWG' },
        ],
        'USD',
      ),
    ).toThrow(/Currency isolation violation/);

    expect(() =>
      validateBalancedJournalLines(
        [
          { accountCode: 'gateway_clearing', direction: 'debit', amountMinor: 10000, currencyCode: 'USD' },
          { accountCode: 'marketplace_commission_revenue', direction: 'credit', amountMinor: 9999, currencyCode: 'USD' },
        ],
        'USD',
      ),
    ).toThrow(/Unbalanced double-entry journal/);
  });

  it('builds balanced pro-rata refund reversal lines', () => {
    const { commissionReversalMinor, supplierReversalMinor } = calculateProRataReversal({
      refundAmountMinor: 10000,
      totalPaidMinor: 20000,
      commissionAmountMinor: 2500,
    });
    expect(commissionReversalMinor).toBe(1250);
    expect(supplierReversalMinor).toBe(8750);

    const reversalLines = buildRefundReversalJournalLines({
      refundAmountMinor: 10000,
      commissionReversalMinor,
      supplierReversalMinor,
      currencyCode: 'USD',
      supplierId: 'sup-1',
    });
    const balance = validateBalancedJournalLines(reversalLines, 'USD');
    expect(balance.totalDebitsMinor).toBe(10000);
    expect(balance.totalCreditsMinor).toBe(10000);
  });

  it('encrypts and decrypts Pesepay payloads via AES-256-CBC using first 16 chars IV and rejects wrong keys', () => {
    const adapter = new PesepayAdapter();
    const key = '12345678901234567890123456789012';
    const wrongKey = 'abcdefghijklmnopqrstuvwxyz123456';

    const payload = {
      merchantReference: 'PAY-TT-2026-AB12',
      amountDetails: { amount: 250.0, currencyCode: 'USD' },
      paymentMetadata: { beneficiaryMerchantEmail: 'operator@example.com' },
    };

    const encrypted = adapter.encryptPayload(payload, key);
    const decrypted = adapter.decryptPayload(encrypted, key);

    expect(decrypted.merchantReference).toBe('PAY-TT-2026-AB12');
    expect(() => adapter.decryptPayload(encrypted, wrongKey)).toThrow();
    expect(() => adapter.encryptPayload(payload, 'short-key')).toThrow();
  });

  it('blocks live split refunds unless explicitly verified via configuration', async () => {
    const adapter = new PesepayAdapter();
    await expect(
      adapter.refundTransaction({
        providerReference: 'PESE-123',
        amountMinor: 5000,
        currencyCode: 'USD',
        reason: 'Requested cancellation',
        refundType: 'full',
      }),
    ).rejects.toThrow(/PESEPAY_SPLIT_REFUNDS_VERIFIED|disabled/i);
  });

  it('sanitizes control characters and rejects non-HTTP URLs cleanly', () => {
    expect(sanitizePlainText('  Hello\u0000 World\n ')).toBe('Hello World');
    expect(isValidHttpUrl('https://developers.pesepay.com/')).toBe(true);
    expect(isValidHttpUrl('javascript:alert(1)')).toBe(false);
  });

  it('formats and parses minor currency units consistently', () => {
    expect(parseMajorToMinor('145.50')).toBe(14550);
    expect(formatMinorCurrency(14550, 'USD')).toBe('USD 145.50');
  });
});
