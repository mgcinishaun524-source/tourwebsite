export type LedgerAccountCode =
  | 'gateway_clearing'
  | 'marketplace_commission_revenue'
  | 'supplier_settlement_clearing'
  | 'payment_processing_expense'
  | 'refund_reversal_clearing'
  | 'tax_liability_payable';

export interface LedgerJournalLine {
  accountCode: LedgerAccountCode;
  direction: 'debit' | 'credit';
  amountMinor: number;
  currencyCode: string;
  supplierId?: string | null;
}

export function validateBalancedJournalLines(
  lines: LedgerJournalLine[],
  expectedCurrency: string,
): { totalDebitsMinor: number; totalCreditsMinor: number } {
  if (lines.length < 2) {
    throw new Error('Double-entry journal requires at least two lines');
  }

  let totalDebitsMinor = 0;
  let totalCreditsMinor = 0;

  for (const line of lines) {
    if (!Number.isSafeInteger(line.amountMinor) || line.amountMinor <= 0) {
      throw new Error('All ledger entries require a positive integer amountMinor');
    }
    if (line.currencyCode !== expectedCurrency) {
      throw new Error(
        `Currency isolation violation: journal is ${expectedCurrency}, entry is ${line.currencyCode}`,
      );
    }
    if (line.direction === 'debit') {
      totalDebitsMinor += line.amountMinor;
    } else if (line.direction === 'credit') {
      totalCreditsMinor += line.amountMinor;
    } else {
      throw new Error(`Invalid ledger direction: ${String(line.direction)}`);
    }
  }

  if (totalDebitsMinor !== totalCreditsMinor) {
    throw new Error(
      `Unbalanced double-entry journal: debits (${totalDebitsMinor}) !== credits (${totalCreditsMinor})`,
    );
  }

  return { totalDebitsMinor, totalCreditsMinor };
}

export function buildPaymentCaptureJournalLines(params: {
  grossPaidMinor: number;
  commissionAmountMinor: number;
  supplierShareMinor: number;
  taxMinor?: number;
  currencyCode: string;
  supplierId: string;
}): LedgerJournalLine[] {
  const taxMinor = params.taxMinor ?? 0;
  const lines: LedgerJournalLine[] = [
    {
      accountCode: 'gateway_clearing',
      direction: 'debit',
      amountMinor: params.grossPaidMinor,
      currencyCode: params.currencyCode,
      supplierId: null,
    },
  ];

  if (params.commissionAmountMinor > 0) {
    lines.push({
      accountCode: 'marketplace_commission_revenue',
      direction: 'credit',
      amountMinor: params.commissionAmountMinor,
      currencyCode: params.currencyCode,
      supplierId: null,
    });
  }

  if (params.supplierShareMinor > 0) {
    lines.push({
      accountCode: 'supplier_settlement_clearing',
      direction: 'credit',
      amountMinor: params.supplierShareMinor,
      currencyCode: params.currencyCode,
      supplierId: params.supplierId,
    });
  }

  if (taxMinor > 0) {
    lines.push({
      accountCode: 'tax_liability_payable',
      direction: 'credit',
      amountMinor: taxMinor,
      currencyCode: params.currencyCode,
      supplierId: null,
    });
  }

  validateBalancedJournalLines(lines, params.currencyCode);
  return lines;
}

export function buildRefundReversalJournalLines(params: {
  refundAmountMinor: number;
  commissionReversalMinor: number;
  supplierReversalMinor: number;
  currencyCode: string;
  supplierId: string;
}): LedgerJournalLine[] {
  const lines: LedgerJournalLine[] = [];

  if (params.commissionReversalMinor > 0) {
    lines.push({
      accountCode: 'marketplace_commission_revenue',
      direction: 'debit',
      amountMinor: params.commissionReversalMinor,
      currencyCode: params.currencyCode,
      supplierId: null,
    });
  }

  if (params.supplierReversalMinor > 0) {
    lines.push({
      accountCode: 'supplier_settlement_clearing',
      direction: 'debit',
      amountMinor: params.supplierReversalMinor,
      currencyCode: params.currencyCode,
      supplierId: params.supplierId,
    });
  }

  lines.push({
    accountCode: 'refund_reversal_clearing',
    direction: 'credit',
    amountMinor: params.refundAmountMinor,
    currencyCode: params.currencyCode,
    supplierId: null,
  });

  validateBalancedJournalLines(lines, params.currencyCode);
  return lines;
}
