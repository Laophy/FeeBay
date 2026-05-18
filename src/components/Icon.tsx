import type { SVGProps } from 'react';

export type IconName =
  | 'dashboard'
  | 'cart'
  | 'inventory'
  | 'grading'
  | 'trends'
  | 'auction'
  | 'upgrades'
  | 'trophy'
  | 'refresh'
  | 'sound-on'
  | 'sound-off'
  | 'reset'
  | 'cash'
  | 'box'
  | 'sparkle'
  | 'bolt'
  | 'eye'
  | 'tag'
  | 'shield'
  | 'check'
  | 'lock'
  | 'arrow-up'
  | 'arrow-down'
  | 'plus'
  | 'minus'
  | 'x'
  | 'gavel'
  | 'wallet'
  | 'chart-up'
  | 'chart-down'
  | 'flame'
  | 'crown'
  | 'medal'
  | 'package'
  | 'search'
  | 'filter'
  | 'discord'
  | 'coffee'
  | 'users'
  | 'shop';

type Props = SVGProps<SVGSVGElement> & {
  name: IconName;
  size?: number;
  strokeWidth?: number;
};

/**
 * Minimal-stroke icon set. All paths are 24x24 viewBox, currentColor.
 */
export function Icon({ name, size = 16, strokeWidth = 1.75, className, ...rest }: Props) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      {...rest}
    >
      {PATHS[name]}
    </svg>
  );
}

const PATHS: Record<IconName, JSX.Element> = {
  dashboard: (
    <>
      <rect x="3" y="3" width="7" height="9" rx="1" />
      <rect x="14" y="3" width="7" height="5" rx="1" />
      <rect x="14" y="12" width="7" height="9" rx="1" />
      <rect x="3" y="16" width="7" height="5" rx="1" />
    </>
  ),
  users: (
    <>
      <circle cx="9" cy="8" r="3.2" />
      <path d="M3.5 20c0-3.3 2.5-5.6 5.5-5.6s5.5 2.3 5.5 5.6" />
      <path d="M16 5.1a3.2 3.2 0 0 1 0 5.9" />
      <path d="M17.2 14.7c2.3.6 3.8 2.6 3.8 5.3" />
    </>
  ),
  shop: (
    <>
      <path d="M3 8l2-4h14l2 4" />
      <rect x="4" y="8" width="16" height="12" rx="1" />
      <path d="M9.5 20v-6h5v6" />
    </>
  ),
  cart: (
    <>
      <circle cx="9" cy="20" r="1.5" />
      <circle cx="18" cy="20" r="1.5" />
      <path d="M3 4h2l2.5 12h11l2-8H6" />
    </>
  ),
  inventory: (
    <>
      <rect x="3" y="3" width="18" height="5" rx="1" />
      <path d="M5 8v12h14V8" />
      <path d="M10 12h4" />
    </>
  ),
  grading: (
    <>
      <path d="M20 12V7l-8-4-8 4v5c0 5 3.5 8 8 9 4.5-1 8-4 8-9z" />
      <path d="M9 12l2 2 4-4" />
    </>
  ),
  trends: (
    <>
      <path d="M3 17l6-6 4 4 7-8" />
      <path d="M14 7h6v6" />
    </>
  ),
  'chart-up': (
    <>
      <path d="M3 17l6-6 4 4 7-8" />
      <path d="M14 7h6v6" />
    </>
  ),
  'chart-down': (
    <>
      <path d="M3 7l6 6 4-4 7 8" />
      <path d="M14 17h6v-6" />
    </>
  ),
  auction: (
    <>
      <path d="M3 11l5-5 5 5-5 5-5-5z" />
      <path d="M11 13l8 8" />
      <path d="M14 4l6 6" />
      <path d="M2 21h10" />
    </>
  ),
  gavel: (
    <>
      <path d="M3 11l5-5 5 5-5 5-5-5z" />
      <path d="M11 13l8 8" />
      <path d="M14 4l6 6" />
      <path d="M2 21h10" />
    </>
  ),
  upgrades: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1" />
    </>
  ),
  trophy: (
    <>
      <path d="M8 21h8" />
      <path d="M12 17v4" />
      <path d="M7 4h10v5a5 5 0 0 1-10 0V4z" />
      <path d="M17 4h3v3a3 3 0 0 1-3 3" />
      <path d="M7 4H4v3a3 3 0 0 0 3 3" />
    </>
  ),
  medal: (
    <>
      <circle cx="12" cy="15" r="5" />
      <path d="M8 9l-3 6" />
      <path d="M16 9l3 6" />
      <path d="M9 3h6l2 4H7l2-4z" />
    </>
  ),
  crown: (
    <>
      <path d="M3 8l4 6 5-8 5 8 4-6v10H3z" />
      <path d="M3 21h18" />
    </>
  ),
  refresh: (
    <>
      <path d="M20 11A8 8 0 0 0 5.6 6.6L4 8" />
      <path d="M4 13a8 8 0 0 0 14.4 4.4L20 16" />
      <path d="M4 4v4h4" />
      <path d="M20 20v-4h-4" />
    </>
  ),
  'sound-on': (
    <>
      <path d="M5 9v6h3l4 4V5L8 9H5z" />
      <path d="M16 8a5 5 0 0 1 0 8" />
      <path d="M19 5a8 8 0 0 1 0 14" />
    </>
  ),
  'sound-off': (
    <>
      <path d="M5 9v6h3l4 4V5L8 9H5z" />
      <path d="M16 9l5 6M21 9l-5 6" />
    </>
  ),
  reset: (
    <>
      <path d="M3 12a9 9 0 1 0 3-6.7" />
      <path d="M3 4v5h5" />
    </>
  ),
  cash: (
    <>
      <rect x="2" y="6" width="20" height="12" rx="2" />
      <circle cx="12" cy="12" r="2.5" />
      <path d="M6 10h.01M18 14h.01" />
    </>
  ),
  wallet: (
    <>
      <path d="M3 7h15a3 3 0 0 1 3 3v7a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3V7z" />
      <path d="M3 7V5a2 2 0 0 1 2-2h11" />
      <circle cx="17" cy="13" r="1.5" />
    </>
  ),
  box: (
    <>
      <path d="M21 8l-9-5-9 5 9 5 9-5z" />
      <path d="M3 8v8l9 5 9-5V8" />
      <path d="M12 13v8" />
    </>
  ),
  package: (
    <>
      <path d="M21 8l-9-5-9 5 9 5 9-5z" />
      <path d="M3 8v8l9 5 9-5V8" />
      <path d="M3 8l9 5 9-5" />
    </>
  ),
  sparkle: (
    <>
      <path d="M12 3l1.8 4.5L18 9l-4.2 1.5L12 15l-1.8-4.5L6 9l4.2-1.5z" />
      <path d="M19 17l.8 2L22 20l-2.2.8L19 23l-.8-2.2L16 20l2.2-1z" />
    </>
  ),
  bolt: (
    <>
      <path d="M13 2L4 14h7l-1 8 9-12h-7l1-8z" />
    </>
  ),
  flame: (
    <>
      <path d="M12 3s5 4 5 9a5 5 0 0 1-10 0c0-3 2-4 2-7 2 1 3 2 3 5 0-3 0-5 0-7z" />
    </>
  ),
  eye: (
    <>
      <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
  tag: (
    <>
      <path d="M20 12l-8 8L3 11V3h8l9 9z" />
      <circle cx="7.5" cy="7.5" r="1.5" />
    </>
  ),
  shield: (
    <>
      <path d="M12 3l8 4v6c0 4.5-3 7.5-8 8-5-.5-8-3.5-8-8V7z" />
    </>
  ),
  check: <path d="M5 13l4 4 10-10" />,
  lock: (
    <>
      <rect x="4" y="11" width="16" height="10" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </>
  ),
  'arrow-up': (
    <>
      <path d="M12 19V5" />
      <path d="M5 12l7-7 7 7" />
    </>
  ),
  'arrow-down': (
    <>
      <path d="M12 5v14" />
      <path d="M5 12l7 7 7-7" />
    </>
  ),
  plus: (
    <>
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </>
  ),
  minus: <path d="M5 12h14" />,
  x: <path d="M5 5l14 14M19 5L5 19" />,
  discord: (
    <path
      fill="currentColor"
      stroke="none"
      d="M20.317 4.3698a19.7913 19.7913 0 0 0-4.8851-1.5152.0741.0741 0 0 0-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 0 0-.0785-.037 19.7363 19.7363 0 0 0-4.8852 1.515.0699.0699 0 0 0-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 0 0 .0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 0 0 .0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 0 0-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 0 1-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 0 1 .0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 0 1 .0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 0 1-.0066.1276 12.2986 12.2986 0 0 1-1.873.8914.0766.0766 0 0 0-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 0 0 .0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 0 0 .0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 0 0-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189Z"
    />
  ),
  coffee: (
    <>
      <path d="M18 8h1a4 4 0 0 1 0 8h-1" />
      <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" />
      <path d="M6 1v3M10 1v3M14 1v3" />
    </>
  ),
  search: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="M21 21l-4.3-4.3" />
    </>
  ),
  filter: (
    <>
      <path d="M3 4h18l-7 9v6l-4 2v-8z" />
    </>
  ),
};
