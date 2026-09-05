/** Formats a naira amount with thousands separators and no decimals. */
export function formatNaira(amount: number): string {
  return new Intl.NumberFormat('en-NG', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Math.round(amount));
}

/** Parses a user-entered, comma-grouped currency string. Returns 0 for anything unusable. */
export function parseAmount(value: string): number {
  const n = parseFloat(value.replace(/,/g, ''));
  return Number.isFinite(n) ? n : 0;
}

export function formatPercent(value: number, dp = 1): string {
  return `${value.toFixed(dp)}%`;
}
