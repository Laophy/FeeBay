import type { CardRarity, GradingCompanyId } from '../types';
import { centeringBorders } from '../game/centering';
import { CardCreature } from './CardCreature';
import { getCardById } from '../data/cards';
import { getCreatureImage } from '../data/creatureImages';

const RARITY_BORDER_COLOR: Record<CardRarity, string> = {
  Common: '#64748b',
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

const RARITY_GLOW: Record<CardRarity, string> = {
  Common: 'shadow-none',
  Uncommon: 'shadow-emerald-500/20',
  Rare: 'shadow-blue-500/30',
  'Holo Rare': 'shadow-purple-500/40',
  'Secret Rare': 'shadow-rose-500/40',
  'Mythic Rare': 'shadow-amber-400/50',
  'Error Print': 'shadow-red-500/40',
  'First Edition': 'shadow-emerald-400/30',
  Signed: 'shadow-yellow-300/40',
  'Prototype Card': 'shadow-pink-500/50',
};

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
  Common: 'text-slate-200',
  Uncommon: 'text-emerald-200',
  Rare: 'text-blue-200',
  'Holo Rare': 'text-purple-200',
  'Secret Rare': 'text-rose-200',
  'Mythic Rare': 'text-amber-200',
  'Error Print': 'text-red-200',
  'First Edition': 'text-emerald-200',
  Signed: 'text-yellow-200',
  'Prototype Card': 'text-pink-200',
};

function shouldHolo(rarity: CardRarity): boolean {
  return [
    'Holo Rare',
    'Secret Rare',
    'Mythic Rare',
    'Error Print',
    'Signed',
    'Prototype Card',
  ].includes(rarity);
}

function rarityStampLabel(rarity: CardRarity): string | null {
  switch (rarity) {
    case 'First Edition':
      return '1ST EDITION';
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

export function CardArt({
  name,
  rarity,
  hue,
  grade,
  gradingCompany,
  centeringOffsetX = 0,
  centeringOffsetY = 0,
  small,
  cardId,
}: Props) {
  // Look up card def if id provided (for character + set + hp)
  let character = 'default';
  let setName = '';
  let hp = 0;
  if (cardId) {
    try {
      const def = getCardById(cardId);
      character = def.character;
      setName = def.set;
      hp = Math.round(40 + def.popularity * 1.4);
    } catch {
      // unknown card id, fall through to defaults
    }
  }

  const size = small ? 'h-24 w-16' : 'h-40 w-28';
  const isSlabbed = grade !== undefined && grade > 0 && !!gradingCompany;
  const isAuthFail = grade === 0;

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

  return (
    <div
      className={`relative rounded-md shadow-lg ${RARITY_GLOW[rarity]} ${size} overflow-hidden`}
      style={{
        background: cardBodyGradient(hue),
        borderStyle: 'solid',
        borderColor: RARITY_BORDER_COLOR[rarity],
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
      <style>{`
        @keyframes holoShine {
          0% { background-position: -50% 0%; }
          100% { background-position: 150% 0%; }
        }
        @keyframes slabShine {
          0% { transform: translateX(-80%); }
          100% { transform: translateX(180%); }
        }
      `}</style>
    </div>
  );
}

function cardBodyGradient(hue: number): string {
  return `linear-gradient(155deg, hsl(${hue}, 75%, 55%) 0%, hsl(${(hue + 30) % 360}, 80%, 42%) 55%, hsl(${(hue + 220) % 360}, 70%, 26%) 100%)`;
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
  centeringOffsetX: number;
  centeringOffsetY: number;
  small?: boolean;
  hideHeader?: boolean;
  hideFooter?: boolean;
  hideGradePip?: boolean;
}) {
  const innerGradient = `linear-gradient(170deg, hsl(${hue}, 60%, 35%), hsl(${(hue + 200) % 360}, 60%, 18%))`;
  const borderColor = RARITY_BORDER_COLOR[rarity];
  const stampLabel = rarityStampLabel(rarity);
  const holo = shouldHolo(rarity);
  return (
    <div className="relative w-full h-full flex flex-col" style={{ background: cardBodyGradient(hue) }}>
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
                secondary={borderColor}
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
                background: borderColor,
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
              stroke={borderColor}
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

      <div
        className="absolute inset-0 opacity-20 mix-blend-overlay pointer-events-none"
        style={{
          backgroundImage:
            'repeating-linear-gradient(45deg, rgba(255,255,255,0.18) 0 2px, transparent 2px 7px)',
        }}
      />

      {holo && (
        <>
          <div
            className="absolute inset-0 pointer-events-none mix-blend-screen"
            style={{
              opacity: 0.55,
              backgroundImage:
                'linear-gradient(115deg, transparent 35%, rgba(255,255,255,0.65) 50%, transparent 65%)',
              backgroundSize: '200% 200%',
              animation: 'holoShine 6s linear infinite',
            }}
          />
          <div
            className="absolute inset-0 pointer-events-none mix-blend-screen opacity-30"
            style={{
              backgroundImage:
                'radial-gradient(rgba(255,255,255,0.6) 0.6px, transparent 1.4px)',
              backgroundSize: '8px 8px',
            }}
          />
        </>
      )}
      {/* Centering border applied on outer wrapper for raw cards; harmless here for slabbed inner since slab has its own borders */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          borderStyle: 'solid',
          borderColor,
          borderLeftWidth: centeringBorders(centeringOffsetX, centeringOffsetY).left,
          borderRightWidth: centeringBorders(centeringOffsetX, centeringOffsetY).right,
          borderTopWidth: centeringBorders(centeringOffsetX, centeringOffsetY).top,
          borderBottomWidth: centeringBorders(centeringOffsetX, centeringOffsetY).bottom,
          // When this body is used inside a slab, the slab is the only container
          // that should show centering borders. To avoid double-borders we drop alpha here.
          opacity: 0,
        }}
      />
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
