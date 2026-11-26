export function formatMinorCurrency(amountMinor: number, currencyCode = 'USD'): string {
  const safeMinor = Number.isFinite(amountMinor) ? Math.round(amountMinor) : 0;
  const major = (safeMinor / 100).toFixed(2);
  return `${currencyCode} ${major}`;
}

export function parseMajorToMinor(value: string | number): number {
  const cleaned = String(value).replace(/[^0-9.]/g, '');
  if (!cleaned) return 0;
  const parsed = Number(cleaned);
  if (!Number.isFinite(parsed) || parsed < 0) return 0;
  return Math.round(parsed * 100);
}
