/**
 * The single money formatter for the whole UI. Thousands-separated, with cents
 * shown only when the amount isn't a whole dollar. Negatives get a leading minus.
 *   1000    -> "$1,000"
 *   1234.5  -> "$1,234.50"
 *   -42.99  -> "-$42.99"
 *   0       -> "$0"
 */
export function money(n: number): string {
  const sign = n < 0 ? '-' : '';
  const abs = Math.round(Math.abs(n) * 100) / 100;
  const opts: Intl.NumberFormatOptions = Number.isInteger(abs)
    ? {}
    : { minimumFractionDigits: 2, maximumFractionDigits: 2 };
  return `${sign}$${abs.toLocaleString('en-US', opts)}`;
}
