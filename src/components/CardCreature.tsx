type Props = {
  character: string;
  primary: string;
  secondary: string;
  className?: string;
};

/**
 * Renders a creature silhouette inside a 100x100 viewBox.
 * Each shape uses two tones for some depth — `primary` (body) and `secondary` (highlights).
 * Maps every CardDef.character value to a recognizable shape.
 */
export function CardCreature({ character, primary, secondary, className }: Props) {
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden="true">
      {SHAPES[normalize(character)]?.(primary, secondary) ?? SHAPES.default(primary, secondary)}
    </svg>
  );
}

function normalize(c: string): keyof typeof SHAPES {
  const k = c.toLowerCase();
  if (k in SHAPES) return k as keyof typeof SHAPES;
  return 'default';
}

const SHAPES: Record<string, (p: string, s: string) => JSX.Element> = {
  dragon: (p, s) => (
    <g>
      {/* tail */}
      <path d="M 12 64 Q 22 56 32 60 L 28 70 Q 18 72 12 64 Z" fill={p} />
      {/* body */}
      <ellipse cx="50" cy="62" rx="30" ry="14" fill={p} />
      {/* belly highlight */}
      <ellipse cx="50" cy="66" rx="22" ry="6" fill={s} opacity="0.55" />
      {/* wings */}
      <path d="M 40 50 L 32 28 L 50 42 Z" fill={s} />
      <path d="M 60 50 L 68 28 L 50 42 Z" fill={s} />
      {/* head */}
      <circle cx="78" cy="56" r="11" fill={p} />
      {/* horns */}
      <path d="M 76 46 L 78 36 L 82 47 Z" fill={p} />
      <path d="M 84 47 L 90 38 L 88 50 Z" fill={p} />
      {/* eye */}
      <circle cx="82" cy="55" r="1.6" fill="#0f172a" />
    </g>
  ),

  wyvern: (p, s) => (
    <g>
      <path d="M 22 70 Q 28 56 46 56 Q 64 56 70 70 Z" fill={p} />
      <path d="M 28 56 L 14 32 L 44 48 Z" fill={s} />
      <path d="M 64 56 L 78 32 L 48 48 Z" fill={s} />
      <ellipse cx="46" cy="58" rx="20" ry="8" fill={s} opacity="0.55" />
      <circle cx="46" cy="48" r="9" fill={p} />
      <circle cx="48" cy="47" r="1.5" fill="#0f172a" />
      <path d="M 50 70 L 56 84 L 44 78 Z" fill={p} />
    </g>
  ),

  serpent: (p, s) => (
    <g>
      <path
        d="M 18 78 Q 28 62 42 70 Q 56 78 62 64 Q 66 52 56 46 Q 46 40 42 30 Q 38 22 50 18"
        fill="none"
        stroke={p}
        strokeWidth="11"
        strokeLinecap="round"
      />
      <circle cx="56" cy="22" r="8" fill={p} />
      <circle cx="59" cy="20" r="1.4" fill="#0f172a" />
      <path d="M 58 16 L 63 12 L 60 18 Z" fill={s} />
    </g>
  ),

  insect: (p, s) => (
    <g>
      <ellipse cx="50" cy="58" rx="16" ry="20" fill={p} />
      <ellipse cx="50" cy="54" rx="11" ry="14" fill={s} opacity="0.55" />
      <path d="M 22 38 L 50 50 L 26 60 Z" fill={s} />
      <path d="M 78 38 L 50 50 L 74 60 Z" fill={s} />
      <circle cx="50" cy="34" r="9" fill={p} />
      <circle cx="46" cy="33" r="1.6" fill="#0f172a" />
      <circle cx="54" cy="33" r="1.6" fill="#0f172a" />
      <path d="M 44 26 L 38 18" stroke={p} strokeWidth="1.6" />
      <path d="M 56 26 L 62 18" stroke={p} strokeWidth="1.6" />
    </g>
  ),

  amphibian: (p, s) => (
    <g>
      {/* body */}
      <ellipse cx="50" cy="64" rx="28" ry="16" fill={p} />
      <ellipse cx="50" cy="68" rx="22" ry="8" fill={s} opacity="0.55" />
      {/* legs */}
      <ellipse cx="22" cy="74" rx="8" ry="5" fill={p} />
      <ellipse cx="78" cy="74" rx="8" ry="5" fill={p} />
      {/* eyes */}
      <circle cx="38" cy="46" r="7" fill={p} />
      <circle cx="62" cy="46" r="7" fill={p} />
      <circle cx="38" cy="46" r="3.5" fill="#fff" />
      <circle cx="62" cy="46" r="3.5" fill="#fff" />
      <circle cx="38" cy="47" r="2" fill="#0f172a" />
      <circle cx="62" cy="47" r="2" fill="#0f172a" />
    </g>
  ),

  fish: (p, s) => (
    <g>
      <path d="M 18 50 Q 38 26 70 50 Q 38 74 18 50 Z" fill={p} />
      <ellipse cx="46" cy="50" rx="20" ry="10" fill={s} opacity="0.55" />
      <path d="M 70 50 L 86 32 L 82 50 L 86 68 Z" fill={p} />
      <circle cx="30" cy="46" r="2" fill="#0f172a" />
      <path d="M 26 56 Q 34 58 42 56" stroke={s} strokeWidth="1.4" fill="none" />
    </g>
  ),

  plant: (p, s) => (
    <g>
      {/* stem */}
      <path d="M 48 82 L 48 50" stroke={p} strokeWidth="6" />
      {/* leaves */}
      <path d="M 48 64 Q 26 58 28 44 Q 38 50 48 56 Z" fill={p} />
      <path d="M 48 60 Q 70 54 68 40 Q 58 46 48 52 Z" fill={s} />
      {/* flower bud */}
      <circle cx="48" cy="36" r="11" fill={p} />
      <circle cx="48" cy="36" r="5" fill={s} />
      <circle cx="48" cy="36" r="2" fill="#0f172a" />
    </g>
  ),

  beast: (p, s) => (
    <g>
      {/* body */}
      <ellipse cx="50" cy="62" rx="26" ry="12" fill={p} />
      <ellipse cx="50" cy="66" rx="20" ry="6" fill={s} opacity="0.55" />
      {/* legs */}
      <rect x="32" y="68" width="6" height="12" fill={p} />
      <rect x="62" y="68" width="6" height="12" fill={p} />
      {/* head */}
      <circle cx="74" cy="54" r="11" fill={p} />
      <path d="M 70 44 L 74 36 L 78 44 Z" fill={p} />
      <path d="M 78 44 L 82 36 L 86 44 Z" fill={p} />
      <circle cx="76" cy="54" r="1.5" fill="#0f172a" />
      {/* tail */}
      <path d="M 22 60 Q 12 52 14 42 Q 22 50 26 58 Z" fill={p} />
    </g>
  ),

  fox: (p, s) => (
    <g>
      <ellipse cx="50" cy="60" rx="24" ry="10" fill={p} />
      <ellipse cx="50" cy="64" rx="18" ry="5" fill={s} opacity="0.55" />
      <circle cx="74" cy="50" r="11" fill={p} />
      <path d="M 65 41 L 70 32 L 74 44 Z" fill={p} />
      <path d="M 78 44 L 84 34 L 83 46 Z" fill={p} />
      <circle cx="78" cy="50" r="1.5" fill="#0f172a" />
      <path d="M 84 50 L 92 48 L 86 54 Z" fill={s} />
      <path d="M 22 58 Q 8 52 12 38 Q 22 48 28 56 Z" fill={p} />
    </g>
  ),

  goblin: (p, s) => (
    <g>
      <ellipse cx="50" cy="74" rx="18" ry="10" fill={p} />
      <circle cx="50" cy="48" r="20" fill={p} />
      <path d="M 30 38 L 18 22 L 38 36 Z" fill={p} />
      <path d="M 70 38 L 82 22 L 62 36 Z" fill={p} />
      <ellipse cx="42" cy="48" rx="3" ry="2.5" fill="#fff" />
      <ellipse cx="58" cy="48" rx="3" ry="2.5" fill="#fff" />
      <circle cx="42" cy="49" r="1.4" fill="#0f172a" />
      <circle cx="58" cy="49" r="1.4" fill="#0f172a" />
      <path d="M 42 58 Q 50 64 58 58 L 56 60 L 50 62 L 44 60 Z" fill={s} />
    </g>
  ),

  imp: (p, s) => (
    <g>
      <ellipse cx="50" cy="62" rx="20" ry="22" fill={p} />
      <ellipse cx="50" cy="68" rx="14" ry="12" fill={s} opacity="0.55" />
      <path d="M 36 42 L 28 28 L 42 40 Z" fill={p} />
      <path d="M 64 42 L 72 28 L 58 40 Z" fill={p} />
      <circle cx="44" cy="56" r="2.4" fill="#fff" />
      <circle cx="56" cy="56" r="2.4" fill="#fff" />
      <circle cx="44" cy="57" r="1.2" fill="#ef4444" />
      <circle cx="56" cy="57" r="1.2" fill="#ef4444" />
      <path d="M 42 68 L 58 68 L 56 72 L 50 70 L 44 72 Z" fill="#1e1b4b" />
    </g>
  ),

  spirit: (p, s) => (
    <g>
      <path
        d="M 30 36 Q 30 18 50 18 Q 70 18 70 36 L 70 78 L 64 72 L 58 80 L 50 72 L 42 80 L 36 72 L 30 78 Z"
        fill={p}
      />
      <ellipse cx="50" cy="44" rx="20" ry="14" fill={s} opacity="0.4" />
      <circle cx="42" cy="42" r="3" fill="#fff" />
      <circle cx="58" cy="42" r="3" fill="#fff" />
      <circle cx="42" cy="42" r="1.4" fill="#0f172a" />
      <circle cx="58" cy="42" r="1.4" fill="#0f172a" />
    </g>
  ),

  slime: (p, s) => (
    <g>
      <path d="M 22 72 Q 22 36 50 30 Q 78 36 78 72 Z" fill={p} />
      <path d="M 30 66 Q 30 44 50 40 Q 70 44 70 66" fill={s} opacity="0.6" />
      <ellipse cx="40" cy="52" rx="4" ry="5" fill="#fff" />
      <ellipse cx="60" cy="52" rx="4" ry="5" fill="#fff" />
      <circle cx="40" cy="53" r="2" fill="#0f172a" />
      <circle cx="60" cy="53" r="2" fill="#0f172a" />
      <path d="M 38 64 Q 50 70 62 64" stroke="#0f172a" strokeWidth="2" fill="none" />
    </g>
  ),

  mimic: (p, s) => (
    <g>
      <rect x="20" y="48" width="60" height="34" rx="3" fill={p} />
      <rect x="20" y="48" width="60" height="10" rx="3" fill={s} />
      <path d="M 20 52 L 30 38 L 70 38 L 80 52 Z" fill={p} />
      <path d="M 28 58 L 36 50 L 36 58 Z" fill="#fff" />
      <path d="M 44 58 L 52 50 L 52 58 Z" fill="#fff" />
      <path d="M 60 58 L 68 50 L 68 58 Z" fill="#fff" />
      <rect x="46" y="62" width="8" height="6" fill="#fbbf24" />
    </g>
  ),

  bird: (p, s) => (
    <g>
      <path d="M 24 66 Q 38 38 60 44 Q 80 50 78 66 Q 56 78 24 66 Z" fill={p} />
      <path d="M 36 56 Q 48 36 64 46 L 50 60 Z" fill={s} />
      <circle cx="68" cy="50" r="2" fill="#0f172a" />
      <path d="M 76 50 L 90 46 L 80 56 Z" fill="#fbbf24" />
      <path d="M 38 66 L 32 78 L 44 70 Z" fill={p} />
    </g>
  ),

  wurm: (p, s) => (
    <g>
      <path
        d="M 14 64 Q 22 50 32 64 Q 42 78 52 64 Q 62 50 72 64 Q 82 78 90 64"
        fill="none"
        stroke={p}
        strokeWidth="12"
        strokeLinecap="round"
      />
      <path
        d="M 14 64 Q 22 50 32 64 Q 42 78 52 64 Q 62 50 72 64"
        fill="none"
        stroke={s}
        strokeWidth="4"
        opacity="0.55"
        strokeLinecap="round"
      />
      <circle cx="88" cy="58" r="2" fill="#0f172a" />
    </g>
  ),

  knight: (p, s) => (
    <g>
      <rect x="38" y="40" width="24" height="38" rx="3" fill={p} />
      <rect x="38" y="40" width="24" height="10" fill={s} />
      <circle cx="50" cy="28" r="14" fill={p} />
      <rect x="46" y="20" width="8" height="20" fill={s} />
      <rect x="42" y="28" width="4" height="4" fill="#0f172a" />
      <rect x="54" y="28" width="4" height="4" fill="#0f172a" />
      <rect x="24" y="46" width="14" height="6" fill={p} />
      <rect x="62" y="46" width="14" height="6" fill={p} />
      <path d="M 70 28 L 78 16 L 76 50 L 70 50 Z" fill={s} />
    </g>
  ),

  construct: (p, s) => (
    <g>
      <rect x="32" y="38" width="36" height="40" fill={p} />
      <rect x="32" y="38" width="36" height="10" fill={s} />
      <rect x="38" y="46" width="6" height="6" fill="#fbbf24" />
      <rect x="56" y="46" width="6" height="6" fill="#fbbf24" />
      <rect x="36" y="60" width="28" height="6" fill={s} />
      <rect x="22" y="44" width="10" height="22" fill={p} />
      <rect x="68" y="44" width="10" height="22" fill={p} />
      <rect x="22" y="60" width="10" height="6" fill={s} />
      <rect x="68" y="60" width="10" height="6" fill={s} />
    </g>
  ),

  demon: (p, s) => (
    <g>
      <ellipse cx="50" cy="62" rx="26" ry="20" fill={p} />
      <path d="M 30 50 L 22 30 L 40 44 Z" fill={p} />
      <path d="M 70 50 L 78 30 L 60 44 Z" fill={p} />
      <ellipse cx="40" cy="58" rx="4" ry="5" fill="#fbbf24" />
      <ellipse cx="60" cy="58" rx="4" ry="5" fill="#fbbf24" />
      <circle cx="40" cy="59" r="1.8" fill="#0f172a" />
      <circle cx="60" cy="59" r="1.8" fill="#0f172a" />
      <path d="M 42 72 L 46 76 L 50 72 L 54 76 L 58 72 L 54 80 L 46 80 Z" fill={s} />
      <path d="M 32 78 Q 22 86 14 80" stroke={p} strokeWidth="3" fill="none" />
      <path d="M 68 78 Q 78 86 86 80" stroke={p} strokeWidth="3" fill="none" />
    </g>
  ),

  default: (p, s) => (
    <g>
      <path d="M 50 14 L 60 40 L 86 44 L 66 60 L 72 86 L 50 72 L 28 86 L 34 60 L 14 44 L 40 40 Z" fill={p} />
      <circle cx="50" cy="50" r="10" fill={s} opacity="0.55" />
    </g>
  ),
};
