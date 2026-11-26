/**
 * Integer minor-unit marketplace commission calculator.
 * All financial amounts MUST be non-negative safe integers in minor currency units (e.g. cents).
 * Floating-point arithmetic is strictly prohibited for monetary allocation.
 */

export interface CommissionRuleCandidate {
  id: string;
  scopeType: 'global' | 'category' | 'supplier' | 'experience' | 'promotion';
  rateBps: number;
  priority: number;
  isDevelopmentSample?: boolean;
}

export interface CommissionCalculationInput {
  unitPriceMinor: number;
  quantity: number;
  discountMinor?: number;
  taxMinor?: number;
  rateBps: number;
  currencyCode: string;
  commissionRuleId?: string | null;
  commissionAgreementId?: string | null;
}

export interface CommissionCalculationSnapshot {
  originalUnitPriceMinor: number;
  quantity: number;
  grossAmountMinor: number;
  discountMinor: number;
  taxMinor: number;
  netCommissionableMinor: number;
  commissionRateBps: number;
  commissionAmountMinor: number;
  supplierShareMinor: number;
  currencyCode: string;
  commissionRuleId: string | null;
  commissionAgreementId: string | null;
}

const SCOPE_WEIGHT: Record<CommissionRuleCandidate['scopeType'], number> = {
  promotion: 500,
  experience: 400,
  supplier: 300,
  category: 200,
  global: 100,
};

function assertNonNegativeSafeInt(value: number, label: string): void {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new Error(`${label} must be a non-negative integer minor currency unit`);
  }
}

export function selectEffectiveCommissionRule(
  candidates: CommissionRuleCandidate[],
): CommissionRuleCandidate | null {
  if (!candidates.length) return null;
  return [...candidates].sort((a, b) => {
    const scopeDiff = SCOPE_WEIGHT[b.scopeType] - SCOPE_WEIGHT[a.scopeType];
    if (scopeDiff !== 0) return scopeDiff;
    return b.priority - a.priority;
  })[0];
}

export function calculateCommissionSnapshot(
  input: CommissionCalculationInput,
): CommissionCalculationSnapshot {
  assertNonNegativeSafeInt(input.unitPriceMinor, 'unitPriceMinor');
  if (!Number.isSafeInteger(input.quantity) || input.quantity <= 0) {
    throw new Error('quantity must be a positive integer');
  }

  const discountMinor = input.discountMinor ?? 0;
  const taxMinor = input.taxMinor ?? 0;
  assertNonNegativeSafeInt(discountMinor, 'discountMinor');
  assertNonNegativeSafeInt(taxMinor, 'taxMinor');

  if (!Number.isSafeInteger(input.rateBps) || input.rateBps < 0 || input.rateBps > 5000) {
    throw new Error('commission rateBps must be an integer between 0 and 5000 (0% - 50%)');
  }

  if (!/^[A-Z]{3}$/.test(input.currencyCode)) {
    throw new Error('currencyCode must be a 3-letter ISO-4217 code');
  }

  const grossAmountMinor = input.unitPriceMinor * input.quantity;
  if (discountMinor + taxMinor > grossAmountMinor) {
    throw new Error('Discounts and taxes cannot exceed gross booking amount');
  }

  const netCommissionableMinor = grossAmountMinor - discountMinor - taxMinor;

  // Deterministic half-up integer basis-point division using BigInt to eliminate overflow/float precision drift
  const commissionBig =
    (BigInt(netCommissionableMinor) * BigInt(input.rateBps) + 5000n) / 10000n;
  const commissionAmountMinor = Number(commissionBig);
  const supplierShareMinor = netCommissionableMinor - commissionAmountMinor;

  if (commissionAmountMinor + supplierShareMinor + taxMinor !== grossAmountMinor - discountMinor) {
    throw new Error('Commission split conservation invariant violated');
  }

  return {
    originalUnitPriceMinor: input.unitPriceMinor,
    quantity: input.quantity,
    grossAmountMinor,
    discountMinor,
    taxMinor,
    netCommissionableMinor,
    commissionRateBps: input.rateBps,
    commissionAmountMinor,
    supplierShareMinor,
    currencyCode: input.currencyCode,
    commissionRuleId: input.commissionRuleId ?? null,
    commissionAgreementId: input.commissionAgreementId ?? null,
  };
}

/**
 * Sample development-only category rates (explicitly flagged non-production in UI/API).
 * Not approved commercial rates.
 */
export const DEV_SAMPLE_CATEGORY_RATES_BPS: Record<string, number> = {
  'Safari Adventures': 1000, // 10%
  Accommodation: 1200, // 12%
  'Airport Transfers': 800, // 8%
  'White-Water Rafting': 1500, // 15%
  'Guided Tours': 1000, // 10%
  'Helicopter Flights': 1200, // 12%
  'River Cruises': 1000, // 10%
  'Cultural Experiences': 1000, // 10%
  'Nature & Rainforest': 1000, // 10%
};
