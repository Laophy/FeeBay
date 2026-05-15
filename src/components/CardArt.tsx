import { memo } from 'react';
import type { CardRarity, CardVariant, GradingCompanyId } from '../types';
import { centeringBorders } from '../game/centering';
import { CardCreature } from './CardCreature';
import { getCardById } from '../data/cards';
import { getCreatureImage } from '../data/creatureImages';

/** Card frame border colour by set. Most sets are yellow; Lunar Echoes is a
 *  silver-bordered prototype set; 1st Edition runs get a deeper gold. */
function cardBorderColor(setName: string, firstEdition?: boolean): string {
  if (setName.startsWith('Lunar Echoes')) return '#c3c8d0'; // silver
  if (firstEdition) return '#d8a93a'; // deep gold
  return '#f5af02'; // eBay yellow — default
}

const RARITY_SYMBOL: Record<CardRarity, string> = {
  Common: '●',
  Uncommon: '◆',
  Rare: '★',
  'Holo Rare': '✦',
  'Secret Rare': '✺',
  'Mythic Rare': '✺',
  'Error Print': '!?',
  'First Edition': '1ST',
  Signed: '✍',
  'Prototype Card': 'α',
};

const RARITY_TEXT_COLOR: Record<CardRarity, string> = {
  Common: 'text-white/85',
  Uncommon: 'text-emerald-100',
  Rare: 'text-blue-100',
  'Holo Rare': 'text-purple-100',
  'Secret Rare': 'text-rose-100',
  'Mythic Rare': 'text-amber-100',
  'Error Print': 'text-red-100',
  'First Edition': 'text-emerald-100',
  Signed: 'text-yellow-100',
  'Prototype Card': 'text-pink-100',
};

/** Accent colour used for inner trim / signature / creature secondary. */
const RARITY_ACCENT: Record<CardRarity, string> = {
  Common: '#94a3b8',
  Uncommon: '#22c55e',
  Rare: '#3b82f6',
  'Holo Rare': '#a855f7',
  'Secret Rare': '#f43f5e',
  'Mythic Rare': '#fbbf24',
  'Error Print': '#ef4444',
  'First Edition': '#34d399',
  Signed: '#fde047',
  'Prototype Card': '#ec4899',
};

function rarityStampLabel(rarity: CardRarity): string | null {
  switch (rarity) {
    case 'Error Print':
      return 'ERROR';
    case 'Prototype Card':
      return 'PROTOTYPE';
    case 'Secret Rare':
      return 'SECRET';
    default:
      return null;
  }
}

type Props = {
  name: string;
  rarity: CardRarity;
  hue: number;
  grade?: number;
  gradingCompany?: GradingCompanyId;
  centeringOffsetX?: number;
  centeringOffsetY?: number;
  small?: boolean;
  cardId?: string;
  /** When false, holo foil renders statically (no infinite animation). Use for big grids. */
  animated?: boolean;
};

const SLAB_THEME: Record<
  GradingCompanyId,
  { bg: string; text: string; accent: string; border: string; serial: string }
> = {
  ZAG: {
    bg: 'linear-gradient(180deg, #0a5c9a 0%, #0972bf 60%, #075a99 100%)',
    text: '#f0f9ff',
    accent: '#7dd3fc',
    border: '#0c4a6e',
    serial: '#bfdbfe',
  },
  PZA: {
    bg: 'linear-gradient(180deg, #b91c1c 0%, #dc2626 55%, #991b1b 100%)',
    text: '#ffffff',
    accent: '#fee2e2',
    border: '#7f1d1d',
    serial: '#fecaca',
  },
  Bucket: {
    bg: 'linear-gradient(180deg, #b45309 0%, #d97706 60%, #92400e 100%)',
    text: '#fffbeb',
    accent: '#fcd34d',
    border: '#78350f',
    serial: '#fde68a',
  },
};

/** Deterministic 4-char hex from a string, used as a stand-in cert serial. */
function shortCert(seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
  return ('0000' + (Math.abs(h) % 0xfffffff).toString(16).toUpperCase()).slice(-7);
}

export const CardArt = memo(function CardArt({
  name,
  rarity,
  hue,
  grade,
  gradingCompany,
  centeringOffsetX = 0,
  centeringOffsetY = 0,
  small,
  cardId,
  animated = true,
}: Props) {
  // Look up card def if id provided (for character + set + variant + edition).
  let character = 'default';
  let setName = '';
  let hp = 0;
  let variant: CardVariant = 'normal';
  let firstEdition = false;
  if (cardId) {
    try {
      const def = getCardById(cardId);
      character = def.character;
      setName = def.set;
      hp = Math.round(40 + def.popularity * 1.4);
      variant = def.variant;
      firstEdition = !!def.firstEdition;
    } catch {
      // unknown card id, fall through to defaults
    }
  }

  const size = small ? 'h-24 w-16' : 'h-40 w-28';
  const isSlabbed = grade !== undefined && grade > 0 && !!gradingCompany;
  const isAuthFail = grade === 0;
  const borderColor = cardBorderColor(setName, firstEdition);

  const cardBody = (
    <CardBody
      name={name}
      rarity={rarity}
      hue={hue}
      character={character}
      setName={setName}
      hp={hp}
      grade={grade}
      cardId={cardId}
      variant={variant}
      firstEdition={firstEdition}
      borderColor={borderColor}
      animated={animated}
      centeringOffsetX={centeringOffsetX}
      centeringOffsetY={centeringOffsetY}
      small={small}
      hideHeader={isSlabbed}
      hideFooter={isSlabbed}
      hideGradePip={isSlabbed}
    />
  );

  if (isSlabbed && gradingCompany) {
    return (
      <SlabFrame
        company={gradingCompany}
        grade={grade!}
        name={name}
        rarity={rarity}
        setName={setName}
        small={!!small}
        size={size}
        certSeed={cardId ?? name}
      >
        {cardBody}
      </SlabFrame>
    );
  }

  if (isAuthFail) {
    return (
      <div
        className={`relative ${size} rounded-md overflow-hidden border-2 border-rose-600`}
        style={{ background: '#1f0a0c' }}
      >
        <div className="absolute inset-0 opacity-90">{cardBody}</div>
        <div className="absolute inset-0 bg-rose-900/40 mix-blend-multiply pointer-events-none" />
        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 text-center">
          <div className="inline-block px-1 py-0.5 bg-rose-600 text-white text-[8px] font-black tracking-widest rotate-[-8deg]">
            AUTH FAIL
          </div>
        </div>
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none"
          viewBox="0 0 100 140"
          preserveAspectRatio="none"
        >
          <path
            d="M 0 30 L 30 50 L 20 80 L 60 90 L 50 120 L 100 110"
            stroke="rgba(255,255,255,0.6)"
            strokeWidth="0.8"
            fill="none"
          />
        </svg>
      </div>
    );
  }

  const glow =
    variant === 'holo'
      ? 'shadow-lg'
      : variant === 'reverse_holo'
      ? 'shadow-md'
      : 'shadow-sm';

  return (
    <div
      className={`relative rounded-md ${glow} ${size} overflow-hidden`}
      style={{
        background: cardBodyGradient(hue, variant),
        borderStyle: 'solid',
        borderColor,
        borderLeftWidth: centeringBorders(centeringOffsetX, centeringOffsetY).left,
        borderRightWidth: centeringBorders(centeringOffsetX, centeringOffsetY).right,
        borderTopWidth: centeringBorders(centeringOffsetX, centeringOffsetY).top,
        borderBottomWidth: centeringBorders(centeringOffsetX, centeringOffsetY).bottom,
      }}
      title={
        centeringOffsetX || centeringOffsetY
          ? `Centering offset X:${centeringOffsetX} Y:${centeringOffsetY}`
          : undefined
      }
    >
      {cardBody}
    </div>
  );
});

/** Body gradient. Holo is vivid and saturated, normal is flat and muted. */
function cardBodyGradient(hue: number, variant: CardVariant): string {
  if (variant === 'holo') {
    return `linear-gradient(155deg, hsl(${hue}, 78%, 56%) 0%, hsl(${(hue + 30) % 360}, 82%, 42%) 55%, hsl(${(hue + 220) % 360}, 72%, 26%) 100%)`;
  }
  if (variant === 'reverse_holo') {
    return `linear-gradient(155deg, hsl(${hue}, 58%, 52%) 0%, hsl(${(hue + 24) % 360}, 60%, 40%) 60%, hsl(${(hue + 200) % 360}, 52%, 28%) 100%)`;
  }
  // normal — flat, low-saturation, plain stock
  return `linear-gradient(160deg, hsl(${hue}, 30%, 56%) 0%, hsl(${hue}, 28%, 44%) 100%)`;
}

function CardBody({
  name,
  rarity,
  hue,
  character,
  setName,
  hp,
  grade,
  cardId,
  variant,
  firstEdition,
  borderColor,
  animated,
  centeringOffsetX,
  centeringOffsetY,
  small,
  hideHeader,
  hideFooter,
  hideGradePip,
}: {
  name: string;
  rarity: CardRarity;
  hue: number;
  character: string;
  setName: string;
  hp: number;
  grade?: number;
  cardId?: string;
  variant: CardVariant;
  firstEdition: boolean;
  borderColor: string;
  animated: boolean;
  centeringOffsetX: number;
  centeringOffsetY: number;
  small?: boolean;
  hideHeader?: boolean;
  hideFooter?: boolean;
  hideGradePip?: boolean;
}) {
  const accent = RARITY_ACCENT[rarity];
  const isHolo = variant === 'holo';
  const isReverse = variant === 'reverse_holo';
  const isNormal = variant === 'normal';
  const innerGradient = isNormal
    ? `linear-gradient(170deg, hsl(${hue}, 24%, 38%), hsl(${hue}, 22%, 24%))`
    : `linear-gradient(170deg, hsl(${hue}, 60%, 35%), hsl(${(hue + 200) % 360}, 60%, 18%))`;
  const stampLabel = firstEdition ? '1ST EDITION' : rarityStampLabel(rarity);
  const stampBg = firstEdition ? '#d8a93a' : accent;

  return (
    <div
      className="relative w-full h-full flex flex-col"
      style={{ background: cardBodyGradient(hue, variant) }}
    >
      {!hideHeader && (
        <div className={`relative z-10 flex items-center gap-1 px-1 ${small ? 'pt-0.5' : 'pt-1'}`}>
          <div
            className={`flex-1 text-white font-semibold drop-shadow truncate ${small ? 'text-[8px]' : 'text-[10px]'}`}
          >
            {name}
          </div>
          {!small && hp > 0 && (
            <div className="text-[8px] font-bold bg-black/40 text-white rounded px-1 leading-tight">
              HP {hp}
            </div>
          )}
        </div>
      )}

      <div className={`relative ${hideHeader ? 'mt-1' : ''} mx-1 ${small ? 'my-0.5' : 'my-1'} flex-1`}>
        <div
          className="absolute inset-0 rounded-sm"
          style={{
            background: innerGradient,
            boxShadow: `inset 0 0 0 1px rgba(255,255,255,0.12), inset 0 0 0 2px ${borderColor}55`,
          }}
        />
        <div className="relative w-full h-full flex items-center justify-center">
          {(() => {
            const img = getCreatureImage(cardId);
            if (img) {
              return (
                <img
                  src={img}
                  alt={name}
                  draggable={false}
                  className="max-w-[88%] max-h-[88%] object-contain drop-shadow-md"
                  style={{ imageRendering: 'pixelated' }}
                />
              );
            }
            return (
              <CardCreature
                character={character}
                primary="rgba(255,255,255,0.92)"
                secondary={accent}
                className="w-full h-full"
              />
            );
          })()}
        </div>
        {stampLabel && (
          <div
            className={`absolute ${small ? 'top-0.5 right-0.5' : 'top-1 right-1'} pointer-events-none`}
            style={{ transform: 'rotate(-12deg)' }}
          >
            <div
              className={`px-1 rounded-sm font-black uppercase tracking-wider drop-shadow ${
                small ? 'text-[6px]' : 'text-[8px]'
              }`}
              style={{
                background: stampBg,
                color: '#0f172a',
                letterSpacing: small ? '0.04em' : '0.08em',
              }}
            >
              {stampLabel}
            </div>
          </div>
        )}
        {rarity === 'Signed' && (
          <svg
            viewBox="0 0 100 30"
            className={`absolute ${small ? 'bottom-0 right-1' : 'bottom-1 right-2'} ${small ? 'w-10' : 'w-16'} pointer-events-none`}
            style={{ opacity: 0.95 }}
          >
            <path
              d="M 4 18 Q 12 4 22 16 Q 32 28 44 14 Q 52 4 64 18 L 96 18"
              stroke={accent}
              strokeWidth="2"
              fill="none"
              strokeLinecap="round"
            />
          </svg>
        )}
      </div>

      {!hideFooter && (
        <div
          className={`relative z-10 flex items-center justify-between gap-1 px-1 ${small ? 'pb-0.5 text-[7px]' : 'pb-1 text-[8px]'}`}
        >
          <span
            className={`truncate uppercase tracking-wider ${RARITY_TEXT_COLOR[rarity]} drop-shadow`}
          >
            {small ? character : setName ? `${character} • ${setName}` : character}
          </span>
          <div className="flex items-center gap-1">
            {!isNormal && (
              <span
                className={`px-1 rounded font-black uppercase ${small ? 'text-[6px]' : 'text-[7px]'}`}
                style={{
                  background: isHolo ? 'rgba(255,255,255,0.92)' : 'rgba(255,255,255,0.55)',
                  color: '#0f172a',
                }}
              >
                {isHolo ? 'HOLO' : 'RV'}
              </span>
            )}
            {!hideGradePip && grade !== undefined && (
              <span
                className={`px-1 rounded font-bold ${
                  grade >= 10
                    ? 'bg-amber-300 text-slate-900'
                    : grade >= 9
                    ? 'bg-emerald-300 text-slate-900'
                    : grade > 0
                    ? 'bg-black/60 text-white'
                    : 'bg-rose-500 text-white'
                }`}
              >
                {grade === 0 ? 'FAIL' : grade}
              </span>
            )}
            <span
              className={`font-bold drop-shadow ${RARITY_TEXT_COLOR[rarity]}`}
              style={{ textShadow: '0 1px 2px rgba(0,0,0,0.6)' }}
            >
              {RARITY_SYMBOL[rarity]}
            </span>
          </div>
        </div>
      )}

      {/* Texture overlay — pronounced on holo, faint on reverse, none on normal */}
      {!isNormal && (
        <div
          className="absolute inset-0 mix-blend-overlay pointer-events-none"
          style={{
            opacity: isHolo ? 0.22 : 0.12,
            backgroundImage:
              'repeating-linear-gradient(45deg, rgba(255,255,255,0.18) 0 2px, transparent 2px 7px)',
          }}
        />
      )}

      {/* Holo foil — full sweep + sparkle on holo, sparkle-only on reverse holo */}
      {isHolo && (
        <>
          <div
            className="absolute inset-0 pointer-events-none mix-blend-screen"
            style={{
              opacity: 0.6,
              backgroundImage:
                'linear-gradient(115deg, transparent 32%, rgba(255,255,255,0.7) 50%, transparent 68%)',
              backgroundSize: '200% 200%',
              backgroundPosition: animated ? undefined : '62% 0%',
              animation: animated ? 'holoShine 6s linear infinite' : undefined,
            }}
          />
          <div
            className="absolute inset-0 pointer-events-none mix-blend-screen opacity-35"
            style={{
              backgroundImage:
                'radial-gradient(rgba(255,255,255,0.65) 0.6px, transparent 1.4px)',
              backgroundSize: '7px 7px',
            }}
          />
          <div
            className="absolute inset-0 pointer-events-none mix-blend-color-dodge"
            style={{
              opacity: 0.18,
              backgroundImage:
                'linear-gradient(60deg, hsla(0,90%,60%,0.5), hsla(60,90%,60%,0.5), hsla(140,90%,60%,0.5), hsla(220,90%,60%,0.5), hsla(300,90%,60%,0.5))',
              backgroundSize: '300% 300%',
              backgroundPosition: animated ? undefined : '50% 50%',
              animation: animated ? 'holoShine 9s linear infinite' : undefined,
            }}
          />
        </>
      )}
      {isReverse && (
        <div
          className="absolute inset-0 pointer-events-none mix-blend-screen opacity-40"
          style={{
            backgroundImage:
              'radial-gradient(rgba(255,255,255,0.55) 0.7px, transparent 1.6px)',
            backgroundSize: '6px 6px',
          }}
        />
      )}
    </div>
  );
}

function SlabFrame({
  company,
  grade,
  name,
  rarity,
  setName,
  small,
  size,
  certSeed,
  children,
}: {
  company: GradingCompanyId;
  grade: number;
  name: string;
  rarity: CardRarity;
  setName: string;
  small: boolean;
  size: string;
  certSeed: string;
  children: React.ReactNode;
}) {
  const theme = SLAB_THEME[company];
  const isGem = grade >= 10;
  const isPremium = grade >= 9;
  return (
    <div
      className={`relative ${size} rounded-md overflow-hidden`}
      style={{
        background: 'linear-gradient(180deg, #cbd5e1 0%, #e2e8f0 40%, #94a3b8 100%)',
        border: '1.5px solid #475569',
        boxShadow: '0 4px 14px rgba(15,23,42,0.55), inset 0 0 0 1px rgba(255,255,255,0.4)',
      }}
      title={`${company} Grade ${grade} • ${name}`}
    >
      {/* Label band */}
      <div
        className="relative flex flex-col items-stretch"
        style={{
          background: theme.bg,
          borderBottom: `1.5px solid ${theme.border}`,
          color: theme.text,
        }}
      >
        <div className={`flex items-center justify-between px-1 ${small ? 'pt-0.5' : 'pt-1'}`}>
          <span
            className={`${small ? 'text-[7px]' : 'text-[9px]'} font-black tracking-[0.18em]`}
            style={{ color: theme.text }}
          >
            {company}
          </span>
          <span
            className={`${small ? 'text-[7px]' : 'text-[8px]'} font-bold tracking-wider`}
            style={{ color: theme.accent }}
          >
            {isGem ? 'GEM MINT' : isPremium ? 'MINT' : 'GRADED'}
          </span>
        </div>
        <div className={`flex items-center justify-between gap-1 px-1 ${small ? 'pb-0.5' : 'pb-1'}`}>
          <div className="flex-1 min-w-0">
            <div
              className={`${small ? 'text-[7px]' : 'text-[8px]'} truncate font-semibold uppercase tracking-wider`}
              style={{ color: theme.text, opacity: 0.95 }}
            >
              {name}
            </div>
            {!small && (
              <div
                className="text-[7px] truncate uppercase tracking-widest"
                style={{ color: theme.accent, opacity: 0.85 }}
              >
                {setName} • {rarity}
              </div>
            )}
          </div>
          <div
            className={`flex items-baseline justify-center font-black leading-none ${small ? 'min-w-[18px]' : 'min-w-[28px]'}`}
            style={{
              color: isGem ? '#fde047' : '#ffffff',
              textShadow: isGem
                ? '0 0 6px rgba(253,224,71,0.7), 0 1px 1px rgba(0,0,0,0.5)'
                : '0 1px 2px rgba(0,0,0,0.6)',
            }}
          >
            <span className={small ? 'text-[18px]' : 'text-[28px]'}>{grade}</span>
          </div>
        </div>
      </div>

      {/* Card window — inset to look like cardboard behind plastic */}
      <div
        className="relative mx-[3px] my-[2px] rounded-sm overflow-hidden"
        style={{
          height: small ? 'calc(100% - 38px)' : 'calc(100% - 56px)',
          boxShadow:
            'inset 0 0 0 1px rgba(15,23,42,0.4), 0 1px 2px rgba(0,0,0,0.3)',
        }}
      >
        {children}
      </div>

      {/* Bottom cert serial bar */}
      {!small && (
        <div
          className="absolute bottom-0 inset-x-0 flex items-center justify-between px-1.5 py-0.5"
          style={{
            background: theme.bg,
            color: theme.text,
            borderTop: `1px solid ${theme.border}`,
          }}
        >
          <span className="text-[7px] tracking-[0.2em]" style={{ color: theme.accent }}>
            CERT
          </span>
          <span className="text-[7px] font-mono tracking-wider" style={{ color: theme.text }}>
            {shortCert(certSeed)}
          </span>
        </div>
      )}

      {/* Glass shine sweep — moving highlight to sell the "encased" feel */}
      <div
        className="pointer-events-none absolute inset-0 overflow-hidden"
        style={{ mixBlendMode: 'screen' }}
      >
        <div
          className="absolute top-0 bottom-0 -left-1/3 w-1/3"
          style={{
            background:
              'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.18) 50%, transparent 100%)',
            animation: 'slabShine 6s linear infinite',
          }}
        />
      </div>

      {/* Outer plastic edge highlight */}
      <div
        className="pointer-events-none absolute inset-0 rounded-md"
        style={{
          boxShadow:
            'inset 0 1px 0 rgba(255,255,255,0.6), inset 0 -1px 0 rgba(0,0,0,0.3)',
        }}
      />
    </div>
  );
}
