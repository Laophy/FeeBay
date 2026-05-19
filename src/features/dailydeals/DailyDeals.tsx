import { useEffect, useState } from 'react';
import { DAY_LENGTH_MS, useGameStore } from '../../store/useGameStore';
import type { DailyDeal } from '../../types';
import { getCardById } from '../../data/cards';
import { CardArt } from '../../components/CardArt';
import { CardZoomOverlay } from '../../components/CardZoomOverlay';
import { Icon } from '../../components/Icon';
import { centeringLabel, centeringLean } from '../../game/centering';
import { money } from '../../game/format';

const KIND_META: Record<
  DailyDeal['kind'],
  { label: string; chip: string; blurb: string }
> = {
  headliner: {
    label: 'Headliner',
    chip: 'bg-ebayYellow-500 text-ink-900',
    blurb: 'The day’s high-end chase card.',
  },
  grading_find: {
    label: 'Grading find',
    chip: 'bg-feebay-500 text-white',
    blurb: 'Clean and well-centred — a strong grading candidate.',
  },
  slab: {
    label: 'Graded slab',
    chip: 'bg-emerald-600 text-white',
    blurb: 'Already encapsulated — buy and resell.',
  },
  flip: {
    label: 'Flip pick',
    chip: 'bg-ink-700 text-white',
    blurb: 'Everyday raw stock priced to flip.',
  },
};

function fmtCountdown(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export function DailyDeals() {
  const deals = useGameStore((s) => s.dailyDeals);
  const day = useGameStore((s) => s.day);
  const dayStartedAt = useGameStore((s) => s.dayStartedAt);
  const cash = useGameStore((s) => s.cash);
  const buy = useGameStore((s) => s.buyDailyDeal);

  const [now, setNow] = useState(Date.now());
  const [selected, setSelected] = useState<DailyDeal | null>(null);
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const restockMs = Math.max(0, dayStartedAt + DAY_LENGTH_MS - now);
  const dayPct = Math.min(100, Math.round(((DAY_LENGTH_MS - restockMs) / DAY_LENGTH_MS) * 100));

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="rounded-xl border border-line bg-white shadow-card overflow-hidden">
        <div className="flex items-center gap-3 px-5 py-4 border-b border-line bg-gradient-to-r from-ebayYellow-500/15 to-white">
          <div className="w-11 h-11 rounded-lg bg-ebayYellow-500 text-ink-900 flex items-center justify-center shrink-0">
            <Icon name="calendar" size={24} />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-black leading-none text-ink-900">Daily Deals</h1>
            <p className="text-ink-500 text-sm mt-1">
              A curated shop that restocks every day. Grab grading finds, flip stock, and the
              occasional high-end headliner.
            </p>
          </div>
        </div>
        <div className="flex items-center justify-between gap-4 px-5 py-3 flex-wrap">
          <div className="text-xs text-ink-500">
            <span className="uppercase tracking-widest font-bold text-ink-700">Day {day}</span>{' '}
            shelf · {deals.length} card{deals.length === 1 ? '' : 's'} left
          </div>
          <div className="flex items-center gap-3 min-w-[220px]">
            <Icon name="refresh" size={14} className="text-feebay-600 shrink-0" />
            <div className="flex-1">
              <div className="flex items-center justify-between text-[11px] text-ink-500 mb-1">
                <span>Restocks in</span>
                <span className="font-bold text-ink-800 tabular-nums">
                  {fmtCountdown(restockMs)}
                </span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-ink-100 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-ebayYellow-500 to-feebay-500"
                  style={{ width: `${dayPct}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Shelf */}
      {deals.length === 0 ? (
        <div className="rounded-xl border border-dashed border-line p-10 text-center text-ink-500 bg-white">
          <Icon name="calendar" size={28} className="mx-auto text-ink-300" />
          <div className="mt-2 font-semibold text-ink-700">Today’s shelf is cleared out.</div>
          <div className="text-sm">Fresh stock arrives in {fmtCountdown(restockMs)}.</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {deals.map((d) => (
            <DealCard
              key={d.id}
              deal={d}
              canAfford={cash >= d.price}
              onBuy={() => buy(d.id)}
              onInspect={() => setSelected(d)}
            />
          ))}
        </div>
      )}

      {selected && (
        <DealDetailModal
          deal={selected}
          canAfford={cash >= selected.price}
          onClose={() => setSelected(null)}
          onBuy={() => {
            buy(selected.id);
            setSelected(null);
          }}
        />
      )}
    </div>
  );
}

function estRange(trueValue: number): string {
  return `${money(Math.round(trueValue * 0.85))}–${money(Math.round(trueValue * 1.15))}`;
}

function gradeText(deal: DailyDeal): string {
  if (deal.grade === undefined || !deal.gradingCompany) return deal.rawCondition;
  return deal.grade === 10
    ? `${deal.gradingCompany} GEM 10`
    : `${deal.gradingCompany} ${deal.grade}`;
}

function DealCard({
  deal,
  canAfford,
  onBuy,
  onInspect,
}: {
  deal: DailyDeal;
  canAfford: boolean;
  onBuy: () => void;
  onInspect: () => void;
}) {
  const card = getCardById(deal.cardId);
  const meta = KIND_META[deal.kind];
  const isHeadliner = deal.kind === 'headliner';
  const upside = Math.round(((deal.trueValue - deal.price) / Math.max(1, deal.price)) * 100);

  return (
    <div
      className={`rounded-xl border bg-white flex flex-col overflow-hidden shadow-card hover:shadow-cardHover transition ${
        isHeadliner ? 'border-ebayYellow-500 ring-1 ring-ebayYellow-500/50' : 'border-line'
      }`}
    >
      <div
        className={`relative flex items-center justify-center px-4 pt-5 pb-3 ${
          isHeadliner
            ? 'bg-gradient-to-b from-ebayYellow-500/15 to-white'
            : 'bg-gradient-to-b from-ink-100 to-white'
        }`}
      >
        <span
          className={`absolute top-2 left-2 px-1.5 py-0.5 rounded text-[10px] font-bold ${meta.chip}`}
        >
          {meta.label}
        </span>
        <div className="transform transition hover:scale-[1.04]">
          <CardArt
            name={card.name}
            rarity={deal.rarity}
            hue={card.hue}
            cardId={deal.cardId}
            grade={deal.grade}
            gradingCompany={deal.gradingCompany}
            centeringOffsetX={deal.centeringOffsetX}
            centeringOffsetY={deal.centeringOffsetY}
          />
        </div>
      </div>

      <div className="px-3 pb-3 pt-2 flex flex-col gap-2 border-t border-lineSoft">
        <div>
          <div
            className="font-bold text-sm leading-tight truncate text-feebay-700 hover:underline cursor-pointer"
            onClick={onInspect}
          >
            {card.name}
          </div>
          <div className="text-[11px] text-ink-500 truncate">
            <span className="text-ink-700">{deal.rarity}</span>
            <span className="text-ink-300"> • </span>
            <span className="text-ink-500">{gradeText(deal)}</span>
          </div>
        </div>

        <div>
          <div className="text-2xl font-black text-ink-900 leading-none">{money(deal.price)}</div>
          <div className="text-[11px] text-ink-500 mt-1">
            est value{' '}
            <span className="font-bold text-ebayGreen-700">{estRange(deal.trueValue)}</span>
          </div>
        </div>

        <div className="flex items-center justify-between text-[10px]">
          <span className="text-ink-400 italic truncate pr-2">{meta.blurb}</span>
          <span
            className={`font-bold whitespace-nowrap ${
              upside > 0 ? 'text-ebayGreen-600' : 'text-ink-400'
            }`}
          >
            {upside > 0 ? `+${upside}% upside` : 'priced to value'}
          </span>
        </div>

        <div className="flex gap-2 mt-1">
          <button
            onClick={onInspect}
            className="flex-1 rounded-md border border-ink-300 hover:border-ink-500 py-1.5 text-xs font-semibold text-ink-700"
          >
            Inspect
          </button>
          <button
            onClick={onBuy}
            disabled={!canAfford}
            className={`flex-[1.5] rounded-md py-1.5 text-xs font-bold ${
              canAfford
                ? 'bg-ebayYellow-500 hover:bg-ebayYellow-600 text-ink-900 shadow-sm'
                : 'bg-ink-100 text-ink-400 cursor-not-allowed'
            }`}
          >
            Buy {money(deal.price)}
          </button>
        </div>
      </div>
    </div>
  );
}

function DealDetailModal({
  deal,
  canAfford,
  onClose,
  onBuy,
}: {
  deal: DailyDeal;
  canAfford: boolean;
  onClose: () => void;
  onBuy: () => void;
}) {
  const card = getCardById(deal.cardId);
  const meta = KIND_META[deal.kind];
  const [zoomed, setZoomed] = useState(false);
  const totalOffset = Math.abs(deal.centeringOffsetX) + Math.abs(deal.centeringOffsetY);
  const lean = centeringLean(deal.centeringOffsetX, deal.centeringOffsetY);

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-ink-900/55 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="w-[520px] max-w-full rounded-xl border border-line bg-white p-5 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-4">
          <div className="relative shrink-0">
            <CardArt
              name={card.name}
              rarity={deal.rarity}
              hue={card.hue}
              cardId={deal.cardId}
              grade={deal.grade}
              gradingCompany={deal.gradingCompany}
              centeringOffsetX={deal.centeringOffsetX}
              centeringOffsetY={deal.centeringOffsetY}
            />
            <button
              onClick={() => setZoomed(true)}
              className="absolute -top-2.5 -right-2.5 z-20 w-8 h-8 rounded-full bg-feebay-500 hover:bg-feebay-600 text-white flex items-center justify-center shadow-md border-2 border-white transition"
              title="Zoom in to inspect quality & centering"
            >
              <Icon name="search" size={15} />
            </button>
          </div>
          <div className="flex-1 min-w-0">
            <span
              className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold ${meta.chip}`}
            >
              {meta.label}
            </span>
            <div className="text-lg font-bold mt-1.5 text-ink-900">{card.name}</div>
            <div className="text-xs text-ink-500">{card.set}</div>
            <div className="text-sm text-ink-700 mt-2">{meta.blurb}</div>
            <div className="text-2xl font-black text-ink-900 mt-3">{money(deal.price)}</div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 mt-4 text-xs">
          <Pill label="Est. value" value={estRange(deal.trueValue)} accent="text-ebayGreen-700" />
          <Pill label="Rarity" value={deal.rarity} accent="text-ebayYellow-700" />
          <Pill
            label={deal.grade !== undefined ? 'Slab' : 'Condition'}
            value={gradeText(deal)}
            accent="text-ink-900"
          />
          <Pill
            label="Centering"
            value={`${centeringLabel(deal.centeringOffsetX, deal.centeringOffsetY)}${
              lean ? `, ${lean}` : ''
            }`}
            accent={
              totalOffset <= 3
                ? 'text-ebayGreen-600'
                : totalOffset <= 7
                ? 'text-ebayYellow-700'
                : 'text-ebayRed-500'
            }
          />
        </div>

        <div className="flex gap-2 mt-4">
          <button
            onClick={onClose}
            className="flex-1 rounded-md border border-line hover:border-ink-400 py-2.5 text-sm font-semibold text-ink-700"
          >
            Pass
          </button>
          <button
            onClick={onBuy}
            disabled={!canAfford}
            className={`flex-[1.5] rounded-md py-2.5 text-sm font-bold ${
              canAfford
                ? 'bg-ebayYellow-500 hover:bg-ebayYellow-600 text-ink-900 shadow-md shadow-ebayYellow-700/20'
                : 'bg-ink-100 text-ink-400 cursor-not-allowed'
            }`}
          >
            Buy It Now · {money(deal.price)}
          </button>
        </div>
      </div>

      {zoomed && (
        <CardZoomOverlay
          name={card.name}
          rarity={deal.rarity}
          hue={card.hue}
          cardId={deal.cardId}
          grade={deal.grade}
          gradingCompany={deal.gradingCompany}
          centeringOffsetX={deal.centeringOffsetX}
          centeringOffsetY={deal.centeringOffsetY}
          condition={deal.grade !== undefined ? gradeText(deal) : deal.rawCondition}
          onClose={() => setZoomed(false)}
        />
      )}
    </div>
  );
}

function Pill({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <div className="rounded bg-ink-100 px-2 py-1">
      <div className="text-[9px] uppercase tracking-widest text-ink-500 font-bold">{label}</div>
      <div className={`text-xs font-bold ${accent}`}>{value}</div>
    </div>
  );
}
