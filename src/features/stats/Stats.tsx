import { useGameStore } from '../../store/useGameStore';
import { MARKETPLACES } from '../../data/marketplaces';
import { Sparkline } from '../../components/Sparkline';
import { Icon } from '../../components/Icon';
import { BUSINESS_LEVELS, getBusinessLevel, getNextBusinessLevel } from '../../data/businessLevels';
import { calculateCurrentValue } from '../../game/economyEngine';
import { vaultStableFor } from '../../store/useGameStore';

export function Stats() {
  const stats = useGameStore((s) => s.stats);
  const cash = useGameStore((s) => s.cash);
  const reputation = useGameStore((s) => s.reputation);
  const day = useGameStore((s) => s.day);
  const unlocked = useGameStore((s) => s.marketplacesUnlocked);
  const samples = useGameStore((s) => s.netWorthSamples);
  const upgrades = useGameStore((s) => s.upgradesPurchased);
  const achievements = useGameStore((s) => s.achievementsUnlocked);
  const businessLevel = useGameStore((s) => s.businessLevel);
  const promote = useGameStore((s) => s.promoteBusinessLevel);
  const inventory = useGameStore((s) => s.inventory);
  const marketTrends = useGameStore((s) => s.marketTrends);
  const marketNoise = useGameStore((s) => s.marketNoise);
  const convention = useGameStore((s) => s.convention);
  const upgradesPurchased = useGameStore((s) => s.upgradesPurchased);

  const inventoryValue = inventory.reduce(
    (sum, i) =>
      sum +
      (i.status === 'grading'
        ? i.purchasePrice
        : calculateCurrentValue(i, marketTrends, marketNoise, convention, vaultStableFor({ upgradesPurchased }))),
    0,
  );
  const netWorth = cash + inventoryValue;
  const current = getBusinessLevel(businessLevel);
  const nextLevel = getNextBusinessLevel(businessLevel);
  const canPromote =
    nextLevel != null &&
    netWorth >= nextLevel.netWorthRequirement &&
    reputation >= nextLevel.reputationRequirement &&
    cash >= nextLevel.promotionCost;

  const totalGrades = Object.values(stats.gradesReceived).reduce((s, n) => s + n, 0);
  const nextLockedMkt = MARKETPLACES.find(
    (m) => !unlocked.includes(m.id) && reputation < m.unlockReputation,
  );
  const nextLockedDelta = nextLockedMkt ? nextLockedMkt.unlockReputation - reputation : 0;
  const repPct = nextLockedMkt
    ? Math.min(100, Math.round((reputation / nextLockedMkt.unlockReputation) * 100))
    : 100;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Stats &amp; Milestones</h1>
        <p className="text-ink-500 text-sm">
          Lifetime totals, reputation progress, and where the next milestones live.
        </p>
      </div>

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
                  ${nextLevel.promotionCost.toLocaleString()}
                </span>
                <span className="inline-flex items-center gap-1 rounded bg-paper border border-line px-1.5 py-0.5">
                  <Icon name="chart-up" size={10} className="text-feebay-600" />
                  ${nextLevel.netWorthRequirement.toLocaleString()}
                </span>
                <span className="inline-flex items-center gap-1 rounded bg-paper border border-line px-1.5 py-0.5">
                  <Icon name="sparkle" size={10} className="text-ebayYellow-700" />
                  {nextLevel.reputationRequirement} rep
                </span>
              </div>
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

      <div className="rounded-lg border border-line bg-white shadow-card p-4">
        <div className="text-sm font-semibold mb-2">Reputation</div>
        <div className="flex items-center justify-between text-xs text-ink-500 mb-2">
          <span>{reputation} rep</span>
          {nextLockedMkt ? (
            <span>
              Next unlock:{' '}
              <span className="text-feebay-600 font-semibold">{nextLockedMkt.id}</span> at{' '}
              {nextLockedMkt.unlockReputation} rep ({nextLockedDelta} to go)
            </span>
          ) : (
            <span className="text-ebayGreen-600">All marketplaces unlocked.</span>
          )}
        </div>
        <div className="h-2 w-full rounded-full bg-ink-100 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-feebay-500 to-emerald-400"
            style={{ width: `${repPct}%` }}
          />
        </div>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
          {MARKETPLACES.map((m) => {
            const own = unlocked.includes(m.id);
            return (
              <div
                key={m.id}
                className={`rounded border px-3 py-2 flex items-center gap-3 ${
                  own
                    ? 'border-ebayGreen-500/60 bg-ebayGreen-500/10'
                    : reputation >= m.unlockReputation
                    ? 'border-feebay-500/60 bg-feebay-50'
                    : 'border-line bg-white shadow-card opacity-80'
                }`}
              >
                <Icon
                  name={own ? 'check' : 'lock'}
                  size={16}
                  className={own ? 'text-ebayGreen-600' : 'text-ink-400'}
                />
                <div className="flex-1">
                  <div className="text-sm font-semibold">{m.id}</div>
                  <div className="text-[11px] text-ink-500">{m.tagline}</div>
                </div>
                <div
                  className={`text-[10px] uppercase tracking-widest font-bold ${
                    own ? 'text-ebayGreen-600' : 'text-ink-500'
                  }`}
                >
                  {own ? 'Owned' : `${m.unlockReputation} rep`}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="rounded-lg border border-line bg-white shadow-card p-4">
        <div className="text-sm font-semibold mb-3">Net worth over time</div>
        <Sparkline data={samples} width={820} height={140} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-lg border border-line bg-white shadow-card p-4">
          <div className="text-sm font-semibold mb-3">Trading totals</div>
          <Row label="Cash on hand" value={fmt(cash)} accent="text-ebayGreen-600" />
          <Row label="Items bought (lifetime)" value={`${stats.totalBought}`} />
          <Row label="Items sold (lifetime)" value={`${stats.totalSold}`} />
          <Row
            label="Lifetime profit"
            value={fmt(stats.totalProfit)}
            accent={stats.totalProfit >= 0 ? 'text-ebayGreen-600' : 'text-ebayRed-500'}
          />
          <Row label="Fees paid" value={fmt(stats.totalFeesPaid)} accent="text-ebayRed-500" />
          <Row label="Best single sale" value={fmt(stats.bestSaleProfit)} accent="text-ebayGreen-600" />
          <Row label="Biggest loss" value={fmt(stats.biggestLoss)} accent="text-ebayRed-500" />
          <Row label="Highest purchase" value={fmt(stats.highestSinglePurchase)} />
        </div>

        <div className="rounded-lg border border-line bg-white shadow-card p-4">
          <div className="text-sm font-semibold mb-3">Activity</div>
          <Row label="Current day" value={`${day}`} />
          <Row label="Mystery lots opened" value={`${stats.mysteryLotsOpened}`} />
          <Row label="Storage units cracked" value={`${stats.storageUnitsOpened}`} />
          <Row label="Bundles sold" value={`${stats.bundlesSold}`} />
          <Row label="Auctions won" value={`${stats.auctionsWon}`} />
          <Row label="Total grades returned" value={`${totalGrades}`} />
          <Row label="Upgrades owned" value={`${upgrades.length}`} />
          <Row label="Achievements unlocked" value={`${achievements.length}`} />
        </div>
      </div>

      {Object.keys(stats.gradesReceived).length > 0 && (
        <div className="rounded-lg border border-line bg-white shadow-card p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm font-semibold">Grade distribution</div>
            <div className="text-[11px] text-ink-500">
              {totalGrades} graded · best{' '}
              <span className="text-ebayYellow-700 font-bold">
                {Math.max(...Object.keys(stats.gradesReceived).map(Number)).toFixed(1).replace('.0', '')}
              </span>
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            {Object.entries(stats.gradesReceived)
              .sort((a, b) => Number(b[0]) - Number(a[0]))
              .map(([g, count]) => {
                const num = Number(g);
                let styles =
                  'border-line bg-paper text-ink-700 [&_.label]:text-ink-500 [&_.count]:text-ink-900';
                if (num >= 10) {
                  styles =
                    'border-ebayYellow-500 bg-gradient-to-br from-ebayYellow-500/25 to-ebayYellow-500/5 text-ebayYellow-700 [&_.label]:text-ebayYellow-700 [&_.count]:text-ink-900';
                } else if (num >= 9) {
                  styles =
                    'border-ebayGreen-500/60 bg-ebayGreen-500/10 [&_.label]:text-ebayGreen-700 [&_.count]:text-ink-900';
                } else if (num >= 7) {
                  styles =
                    'border-feebay-500/40 bg-feebay-50 [&_.label]:text-feebay-700 [&_.count]:text-ink-900';
                } else if (num >= 5) {
                  styles =
                    'border-line bg-paper [&_.label]:text-ink-500 [&_.count]:text-ink-800';
                } else {
                  styles =
                    'border-ebayRed-500/40 bg-ebayRed-500/5 [&_.label]:text-ebayRed-600 [&_.count]:text-ink-800';
                }
                return (
                  <div
                    key={g}
                    className={`rounded-md px-3 py-2 border ${styles} min-w-[68px] flex flex-col items-center`}
                  >
                    <div className="label text-[10px] uppercase tracking-widest font-bold">
                      Grade {g}
                    </div>
                    <div className="count font-black text-lg leading-none mt-0.5">×{count}</div>
                  </div>
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
}

function Row({
  label,
  value,
  accent = 'text-ink-900',
}: {
  label: string;
  value: string;
  accent?: string;
}) {
  return (
    <div className="flex items-center justify-between text-sm border-b border-line last:border-0 py-1.5">
      <span className="text-ink-500">{label}</span>
      <span className={`font-semibold ${accent}`}>{value}</span>
    </div>
  );
}

function fmt(n: number): string {
  return `$${n.toFixed(2)}`;
}

function PerkStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-white border border-line px-2.5 py-1.5 shadow-sm">
      <div className="text-[9px] uppercase tracking-widest text-ink-500 font-bold">{label}</div>
      <div className="text-ebayYellow-700 font-black text-base leading-tight">{value}</div>
    </div>
  );
}
