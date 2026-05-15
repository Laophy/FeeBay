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
  /** Larger render for detail/inspect screens. */
  large?: boolean;
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
  large,
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

  const size = small ? 'h-24 w-16' : large ? 'h-[252px] w-[176px]' : 'h-40 w-28';
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
    variant === 'rainbow'
      ? 'shadow-xl'
      : variant === 'holo'
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

/** Body gradient. Rainbow cycles every hue, holo is vivid, normal is flat. */
function cardBodyGradient(hue: number, variant: CardVariant): string {
  if (variant === 'rainbow') {
    return `linear-gradient(150deg, hsl(0,82%,56%) 0%, hsl(48,88%,56%) 22%, hsl(140,72%,48%) 45%, hsl(195,82%,52%) 66%, hsl(265,76%,56%) 84%, hsl(320,80%,56%) 100%)`;
  }
  if (variant === 'holo') {
    return `linear-gradient(155deg, hsl(${hue}, 78%, 56%) 0%, hsl(${(hue + 30) % 360}, 82%, 42%) 55%, hsl(${(hue + 220) % 360}, 72%, 26%) 100%)`;
  }
  if (variant === 'reverse_holo') {
    return `linear-gradient(155deg, hsl(${hue}, 58%, 52%) 0%, hsl(${(hue + 24) % 360}, 60%, 40%) 60%, hsl(${(hue + 200) % 360}, 52%, 28%) 100%)`;
  }
  // normal — flat, low-saturation, plain stock
  return `linear-gradient(160deg, hsl(${hue}, 30%, 56%) 0%, hsl(${hue}, 28%, 44%) 100%)`;
}

// --- Holographic foil ------------------------------------------------------
// Idle iridescent foil, rebuilt from scratch. Three drifting gradient layers
// plus a static glitter layer, all sized in fixed px and clipped to the card,
// so the effect is identical at every card size and zoom level — no
// size-dependent math (the old version pinned font-size to the card width).
//
// Seamless: every drifting layer is a repeating-linear-gradient whose first and
// last colour are identical, translated by exactly one band period along X
// (period / sin(angle); see the holoSheen* / holoGlareSweep keyframes). Each
// loop maps the pattern onto itself, so there is no jump — the old tearing came
// from translate distances that did not line up with the band period.
//
// Isolated: CardBody sets `isolation: isolate`, so these blend-mode layers
// composite only against their own card, never against neighbouring cards or
// the page (the old version's cross-card "connection" artefacts).

// Primary iridescent sheen — full hue cycle, identical end colours. 21px band.
const SHEEN_A =
  'repeating-linear-gradient(115deg, hsl(348,95%,73%) 0px, hsl(45,95%,71%) 3.5px, hsl(150,80%,67%) 7px, hsl(192,92%,71%) 10.5px, hsl(255,88%,77%) 14px, hsl(320,90%,75%) 17.5px, hsl(348,95%,73%) 21px)';
// Crossing sheen — different angle and hue order for a shifting prism. 26px band.
const SHEEN_B =
  'repeating-linear-gradient(68deg, hsl(190,92%,73%) 0px, hsl(255,88%,77%) 4.333px, hsl(320,90%,75%) 8.667px, hsl(20,95%,73%) 13px, hsl(95,78%,69%) 17.333px, hsl(150,82%,69%) 21.667px, hsl(190,92%,73%) 26px)';
// One soft white glare per 76px — mostly transparent with a single bump.
const GLARE =
  'repeating-linear-gradient(110deg, transparent 0px, transparent 26px, rgba(255,255,255,0.10) 33px, rgba(255,255,255,0.55) 38px, rgba(255,255,255,0.10) 43px, transparent 50px, transparent 76px)';

// Rainbow-rare variants — brighter, with white sheen streaks woven in and a
// colour-tinted glare. Band periods match the holo tier, so the same keyframes
// drive both unchanged.
const SHEEN_A_RB =
  'repeating-linear-gradient(115deg, hsl(348,100%,79%) 0px, hsl(255,100%,85%) 3.5px, #ffffff 7px, hsl(190,100%,81%) 10.5px, hsl(140,95%,77%) 14px, #ffffff 17.5px, hsl(348,100%,79%) 21px)';
const SHEEN_B_RB =
  'repeating-linear-gradient(68deg, hsl(45,100%,81%) 0px, #ffffff 4.333px, hsl(190,100%,83%) 8.667px, hsl(300,100%,83%) 13px, #ffffff 17.333px, hsl(140,95%,79%) 21.667px, hsl(45,100%,81%) 26px)';
const GLARE_RB =
  'repeating-linear-gradient(110deg, transparent 0px, transparent 24px, hsla(45,100%,80%,0.22) 31px, rgba(255,255,255,0.62) 38px, hsla(280,100%,82%,0.24) 45px, transparent 52px, transparent 76px)';

// Fine glitter — two offset dot grids. Twinkles in place, never drifts, so
// there is no seam to align. One variant per tier sets the glitter strength.
const SPARKLE =
  'radial-gradient(circle, rgba(255,255,255,0.9) 0.6px, transparent 1.5px), radial-gradient(circle, rgba(255,255,255,0.6) 0.5px, transparent 1.2px)';
const SPARKLE_SOFT =
  'radial-gradient(circle, rgba(255,255,255,0.5) 0.6px, transparent 1.5px), radial-gradient(circle, rgba(255,255,255,0.3) 0.5px, transparent 1.2px)';
const SPARKLE_RB =
  'radial-gradient(circle, rgba(255,255,255,1) 0.7px, transparent 1.6px), radial-gradient(circle, rgba(255,255,255,0.8) 0.5px, transparent 1.2px)';

function HoloFoil({
  tier,
  animated,
}: {
  tier: 'holo' | 'reverse' | 'rainbow';
  animated: boolean;
}) {
  const isRainbow = tier === 'rainbow';
  const isReverse = tier === 'reverse';

  // Drifting layers overflow the card by 100px — comfortably more than the
  // largest drift (~81px) — so a sliding pattern never exposes a blank edge.
  // Static renders (big grids, animated=false) just cover the card exactly.
  const spread: React.CSSProperties = {
    position: 'absolute',
    inset: animated ? '-100px' : 0,
  };

  const sheenA = isRainbow ? SHEEN_A_RB : SHEEN_A;
  const sheenB = isRainbow ? SHEEN_B_RB : SHEEN_B;
  const glare = isRainbow ? GLARE_RB : GLARE;
  const sparkle = isReverse ? SPARKLE_SOFT : isRainbow ? SPARKLE_RB : SPARKLE;

  // Calm, slow drift for a refined look; rainbow rares run a little livelier.
  const spd = isRainbow
    ? { a: '9s', b: '13s', g: '7s', t: '2.6s' }
    : { a: '15s', b: '21s', g: '11s', t: '3.8s' };

  // Refined opacities — clearly iridescent without washing out the card art.
  const opSheenA = isReverse ? 0.16 : isRainbow ? 0.46 : 0.34;
  const opSheenB = isRainbow ? 0.3 : 0.17;
  const opGlare = isRainbow ? 0.44 : 0.32;

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Primary iridescent sheen */}
      <div
        className="holo-layer"
        style={{
          ...spread,
          backgroundImage: sheenA,
          mixBlendMode: 'overlay',
          opacity: opSheenA,
          willChange: animated ? 'transform' : undefined,
          animation: animated ? `holoSheenA ${spd.a} linear infinite` : undefined,
        }}
      />
      {/* Crossing sheen — prismatic shift (skipped on the subtle reverse tier) */}
      {!isReverse && (
        <div
          className="holo-layer"
          style={{
            ...spread,
            backgroundImage: sheenB,
            mixBlendMode: 'color-dodge',
            opacity: opSheenB,
            willChange: animated ? 'transform' : undefined,
            animation: animated ? `holoSheenB ${spd.b} linear infinite` : undefined,
          }}
        />
      )}
      {/* Soft glare sweep */}
      {!isReverse && (
        <div
          className="holo-layer"
          style={{
            ...spread,
            backgroundImage: glare,
            mixBlendMode: 'screen',
            opacity: opGlare,
            willChange: animated ? 'transform' : undefined,
            animation: animated
              ? `holoGlareSweep ${spd.g} linear infinite`
              : undefined,
          }}
        />
      )}
      {/* Glitter — twinkles in place, so there is no seam to align */}
      <div
        className="holo-layer absolute inset-0"
        style={{
          backgroundImage: sparkle,
          backgroundSize: '7px 7px, 11px 11px',
          backgroundPosition: '0 0, 3px 5px',
          mixBlendMode: 'screen',
          opacity: animated ? undefined : 0.46,
          animation: animated
            ? `holoTwinkle ${spd.t} ease-in-out infinite`
            : undefined,
        }}
      />
    </div>
  );
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
  const isRainbow = variant === 'rainbow';
  const innerGradient = isNormal
    ? `linear-gradient(170deg, hsl(${hue}, 24%, 38%), hsl(${hue}, 22%, 24%))`
    : `linear-gradient(170deg, hsl(${hue}, 60%, 35%), hsl(${(hue + 200) % 360}, 60%, 18%))`;
  const stampLabel = firstEdition ? '1ST EDITION' : rarityStampLabel(rarity);
  const stampBg = firstEdition ? '#d8a93a' : accent;

  return (
    <div
      className="relative w-full h-full flex flex-col"
      style={{ background: cardBodyGradient(hue, variant), isolation: 'isolate' }}
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
          {/* Rainbow rares wash the creature art in a flowing rainbow filter. */}
          {isRainbow && (
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                mixBlendMode: 'overlay',
                opacity: 0.62,
                backgroundImage:
                  'linear-gradient(115deg, hsl(0,90%,60%), hsl(48,95%,60%), hsl(140,80%,52%), hsl(195,90%,58%), hsl(265,85%,62%), hsl(320,90%,62%), hsl(0,90%,60%))',
                backgroundSize: '220% 220%',
                backgroundPosition: animated ? undefined : '40% 50%',
                animation: animated ? 'rainbowFlow 5s linear infinite' : undefined,
              }}
            />
          )}
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
                style={
                  isRainbow
                    ? {
                        backgroundImage:
                          'linear-gradient(90deg, #ff5d5d, #f5af02, #86b817, #38bdf8, #a855f7)',
                        color: '#ffffff',
                        textShadow: '0 1px 1px rgba(0,0,0,0.55)',
                      }
                    : {
                        background: isHolo ? 'rgba(255,255,255,0.92)' : 'rgba(255,255,255,0.55)',
                        color: '#0f172a',
                      }
                }
              >
                {isRainbow ? 'RAINBOW' : isHolo ? 'HOLO' : 'RV'}
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

      {/* Holographic foil — iridescent sheen, soft glare and glitter. */}
      {!isNormal && (
        <HoloFoil
          tier={isRainbow ? 'rainbow' : isReverse ? 'reverse' : 'holo'}
          animated={animated}
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
            animation: 'slabShine 8s linear infinite',
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
