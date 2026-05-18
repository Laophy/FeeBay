/** Player-chosen cosmetic branding for the card shop. */

export const DEFAULT_SHOP_NAME = 'Your Card Shop';
export const DEFAULT_SHOP_LOGO = 'shop';
export const DEFAULT_SHOP_COLOR = '#0064d2';

/** Brand colour swatches — also tints the app's backdrop. */
export const BRAND_COLORS: { hex: string; label: string }[] = [
  { hex: '#0064d2', label: 'FeeBay Blue' },
  { hex: '#e53238', label: 'Crimson' },
  { hex: '#16a34a', label: 'Emerald' },
  { hex: '#d99e00', label: 'Gold' },
  { hex: '#7c3aed', label: 'Violet' },
  { hex: '#ea580c', label: 'Ember' },
  { hex: '#0d9488', label: 'Teal' },
  { hex: '#db2777', label: 'Magenta' },
  { hex: '#1f2937', label: 'Noir' },
];

/** Logo icon options (names from Icon.tsx). */
export const BRAND_LOGOS: string[] = [
  'shop',
  'crown',
  'trophy',
  'sparkle',
  'medal',
  'gavel',
  'box',
  'cart',
  'tag',
  'bolt',
];
