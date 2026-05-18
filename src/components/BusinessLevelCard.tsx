import { useGameStore, vaultStableFor } from '../store/useGameStore';
import {
  BUSINESS_LEVELS,
  getBusinessLevel,
  getNextBusinessLevel,
} from '../data/businessLevels';
import { calculateCurrentValue } from '../game/economyEngine';
import { money } from '../game/format';
import { Icon } from './Icon';

/**
 * Business-level card — current rank, perks, and next-level requirements.
 * `interactive` adds the Promote button (used on Upgrades); without it the
 * card is a read-only milestone view (used on Stats).
 */
export function BusinessLevelCard({ interactive = false }: { interactive?: boolean }) {
  const businessLevel = useGameStore((s) => s.businessLevel);
  const cash = useGameStore((s) => s.cash);
  const reputation = useGameStore((s) => s.reputation);
  const inventory = useGameStore((s) => s.inventory);
  const marketTrends = useGameStore((s) => s.marketTrends);
  const marketNoise = useGameStore((s) => s.marketNoise);
  const convention = useGameStore((s) => s.convention);
  const upgradesPurchased = useGameStore((s) => s.upgradesPurchased);
  const storefrontBalance = useGameStore((s) => s.storefrontBalance);
  const promote = useGameStore((s) => s.promoteBusinessLevel);

  const inventoryValue = inventory.reduce(
    (sum, i) =>
      sum +
      (i.status === 'grading'
        ? i.purchasePrice
        : calculateCurrentValue(
            i,
            marketTrends,
            marketNoise,
            convention,
            vaultStableFor({ upgradesPurchased }),
          )),
    0,
  );
  const netWorth = cash + storefrontBalance + inventoryValue;
  const current = getBusinessLevel(businessLevel);
  const nextLevel = getNextBusinessLevel(businessLevel);
  const canPromote =
    nextLevel != null &&
    netWorth >= nextLevel.netWorthRequirement &&
    reputation >= nextLevel.reputationRequirement &&
    cash >= nextLevel.promotionCost;

  return (
    <div className="rounded-xl border-2 border-ebayYellow-500 bg-gradient-to-br from-ebayYellow-500/10 via-white to-white shadow-card p-5">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 rounded-lg bg-ebayYellow-500 text-ink-900 flex items-center justify-center shadow-sm shrink-0">
            <Icon name="crown" size={24} />
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-widest text-ebayYellow-700 font-bold">
              Business level {current.level}
            </div>
            <div className="text-2xl font-black text-ink-900 leading-tight">{current.name}</div>
            <div className="text-xs text-ink-500 mt-1 max-w-md">{current.tagline}</div>
          </div>
        </div>
        {nextLevel ? (
          <div className="text-right">
            <div className="text-[10px] uppercase tracking-widest text-ink-500 font-bold">
              Next: <span className="text-ink-900">{nextLevel.name}</span>
            </div>
            <div className="text-xs text-ink-700 mt-1 space-x-1">
              <span className="inline-flex items-center gap-1 rounded bg-paper border border-line px-1.5 py-0.5">
                <Icon name="wallet" size={10} className="text-ebayGreen-600" />
                {money(nextLevel.promotionCost)}
              </span>
              <span className="inline-flex items-center gap-1 rounded bg-paper border border-line px-1.5 py-0.5">
                <Icon name="chart-up" size={10} className="text-feebay-600" />
                {money(nextLevel.netWorthRequirement)}
              </span>
              <span className="inline-flex items-center gap-1 rounded bg-paper border border-line px-1.5 py-0.5">
                <Icon name="sparkle" size={10} className="text-ebayYellow-700" />
                {nextLevel.reputationRequirement} rep
              </span>
            </div>
            {interactive && (
              <button
                onClick={promote}
                disabled={!canPromote}
                className={`mt-2 rounded-md px-4 py-2 text-sm font-bold transition shadow-sm ${
                  canPromote
                    ? 'bg-ebayYellow-500 hover:bg-ebayYellow-600 text-ink-900 border-2 border-ebayYellow-600'
                    : 'bg-ink-100 text-ink-400 cursor-not-allowed border-2 border-line'
                }`}
              >
                {canPromote ? `Promote to ${nextLevel.name}` : 'Locked'}
              </button>
            )}
          </div>
        ) : (
          <div className="inline-flex items-center gap-2 text-ebayYellow-700 text-xs uppercase tracking-widest font-bold bg-ebayYellow-500/15 border border-ebayYellow-500/50 rounded-md px-3 py-1.5">
            <Icon name="crown" size={14} />
            Max level reached
          </div>
        )}
      </div>
      <div className="mt-4 pt-4 border-t border-ebayYellow-500/30 grid grid-cols-2 md:grid-cols-5 gap-2 text-xs">
        <PerkStat label="Bonus listings / refresh" value={`+${current.bonusListings}`} />
        <PerkStat label="Inventory slots" value={`+${current.bonusInventorySlots}`} />
        <PerkStat label="Daily rep" value={`+${current.bonusDailyRep}`} />
        <PerkStat label="Fee discount" value={`${(current.feeDiscount * 100).toFixed(0)}%`} />
        <PerkStat label="Levels owned" value={`${businessLevel} / ${BUSINESS_LEVELS.length}`} />
      </div>
    </div>
  );
}

function PerkStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-white border border-line px-2.5 py-1.5 shadow-sm">
      <div className="text-[9px] uppercase tracking-widest text-ink-500 font-bold">{label}</div>
      <div className="text-ebayYellow-700 font-black text-base leading-tight">{value}</div>
    </div>
  );
}
