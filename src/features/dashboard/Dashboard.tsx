import { useGameStore } from '../../store/useGameStore';
import { calculateCurrentValue } from '../../game/economyEngine';
import { vaultStableFor } from '../../store/useGameStore';
import { Sparkline } from '../../components/Sparkline';
import { Icon, type IconName } from '../../components/Icon';
import type { Route } from '../../App';
import { ACHIEVEMENTS } from '../../data/achievements';
import { CARDS } from '../../data/cards';
import { collectionPercent } from '../../game/collection';
import { getBusinessLevel, getNextBusinessLevel } from '../../data/businessLevels';

type Props = { onNavigate: (r: Route) => void };

function fmt(n: number) {
  return `$${n.toFixed(2)}`;
}

export function Dashboard({ onNavigate }: Props) {
  const cash = useGameStore((s) => s.cash);
  const inventory = useGameStore((s) => s.inventory);
  const trends = useGameStore((s) => s.marketTrends);
  const noise = useGameStore((s) => s.marketNoise);
  const convention = useGameStore((s) => s.convention);
  const upgradesPurchased = useGameStore((s) => s.upgradesPurchased);
  const stats = useGameStore((s) => s.stats);
  const grading = useGameStore((s) => s.gradingSubmissions);
  const notes = useGameStore((s) => s.notifications);
  const marketplaces = useGameStore((s) => s.marketplacesUnlocked);
  const samples = useGameStore((s) => s.netWorthSamples);
  const achievementsUnlocked = useGameStore((s) => s.achievementsUnlocked);
  const claimed = useGameStore((s) => s.achievementsClaimed);
  const collection = useGameStore((s) => s.collection);
  const businessLevel = useGameStore((s) => s.businessLevel);
  const day = useGameStore((s) => s.day);
  const reputation = useGameStore((s) => s.reputation);

  const inventoryValue = inventory.reduce(
    (sum, i) =>
      sum +
      (i.status === 'grading'
        ? i.purchasePrice
        : calculateCurrentValue(i, trends, noise, convention, vaultStableFor({ upgradesPurchased }))),
    0,
  );
  const netWorth = cash + inventoryValue;
  const recentEvents = notes.filter((n) => n.kind === 'event').slice(0, 5);
  const recentFlips = notes.filter((n) => n.kind === 'success' || n.kind === 'warning').slice(0, 6);
  const collectionOwned = Object.keys(collection).length;
  const collectionPct = collectionPercent(collection);
  const unclaimed = achievementsUnlocked.filter((id) => !claimed.includes(id)).length;
  const current = getBusinessLevel(businessLevel);
  const nextLevel = getNextBusinessLevel(businessLevel);

  return (
    <div className="max-w-7xl mx-auto space-y-5">
      {/* Welcome hero */}
      <div className="rounded-xl border border-line bg-white shadow-card overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center gap-4 p-5">
          <div className="flex-1">
            <div className="text-[11px] uppercase tracking-[0.2em] text-ink-500 font-bold">
              Day {day} · {current.name} · {reputation} rep
            </div>
            <h1 className="text-3xl font-black tracking-tight mt-1 text-ink-900">
              Welcome back, reseller
            </h1>
            <p className="text-ink-600 text-sm mt-1">
              {current.tagline} {nextLevel && (
                <span className="text-feebay-600">
                  Next: <span className="font-semibold">{nextLevel.name}</span> at ${nextLevel.netWorthRequirement.toLocaleString()} net worth.
                </span>
              )}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <BigCTA onClick={() => onNavigate('marketplace')} primary icon="cart">
              Browse Marketplace
            </BigCTA>
            <BigCTA onClick={() => onNavigate('inventory')} icon="inventory">
              My Inventory ({inventory.length})
            </BigCTA>
            {unclaimed > 0 && (
              <BigCTA onClick={() => onNavigate('achievements')} icon="trophy" yellow>
                Claim {unclaimed} reward{unclaimed === 1 ? '' : 's'}
              </BigCTA>
            )}
          </div>
        </div>
      </div>

      {/* Summary stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard
          icon="cash"
          label="Cash"
          value={fmt(cash)}
          accent="text-ebayGreen-600"
        />
        <StatCard
          icon="box"
          label="Inventory value"
          value={fmt(inventoryValue)}
          accent="text-feebay-600"
        />
        <StatCard
          icon="chart-up"
          label="Net worth"
          value={fmt(netWorth)}
          accent="text-ink-900"
          bold
        />
        <StatCard
          icon="trends"
          label="Lifetime profit"
          value={fmt(stats.totalProfit)}
          accent={stats.totalProfit >= 0 ? 'text-ebayGreen-600' : 'text-ebayRed-500'}
        />
      </div>

      {/* Net worth chart + quick actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Section title="Net worth over time" className="lg:col-span-2">
          <Sparkline data={samples} width={720} height={140} stroke="#0064d2" fill="rgba(0,100,210,0.12)" />
          <div className="mt-2 text-[11px] text-ink-500">
            Sampled every 5 seconds. Hit $1,000,000 to claim Card Empire.
          </div>
        </Section>

        <Section title="Collection progress">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[10px] uppercase tracking-widest text-ink-500 font-bold">
                Cards owned
              </div>
              <div className="text-2xl font-black text-ink-900 mt-1">
                {collectionOwned}
                <span className="text-base text-ink-500 font-normal">
                  /{CARDS.length}
                </span>
              </div>
            </div>
            <div className="text-3xl font-black text-feebay-500">{collectionPct}%</div>
          </div>
          <div className="h-2 w-full rounded-full bg-ink-100 overflow-hidden mt-3">
            <div
              className="h-full bg-gradient-to-r from-feebay-500 to-ebayGreen-500"
              style={{ width: `${collectionPct}%` }}
            />
          </div>
          <button
            onClick={() => onNavigate('collection')}
            className="w-full mt-3 rounded border border-line hover:border-feebay-500 hover:text-feebay-600 py-1.5 text-xs font-semibold text-ink-700"
          >
            Open codex
          </button>
        </Section>
      </div>

      {/* Activity + best/worst */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Section title="Recent flips" className="lg:col-span-2">
          {recentFlips.length === 0 ? (
            <Empty text="No flips yet. Get out there." />
          ) : (
            <ul className="divide-y divide-line">
              {recentFlips.map((n) => (
                <li
                  key={n.id}
                  className={`py-2 text-sm flex items-start gap-2 ${
                    n.kind === 'success' ? 'text-ebayGreen-700' : 'text-ebayRed-600'
                  }`}
                >
                  <Icon
                    name={n.kind === 'success' ? 'chart-up' : 'chart-down'}
                    size={14}
                    className="mt-0.5 shrink-0"
                  />
                  <span className="text-ink-700">{n.message}</span>
                </li>
              ))}
            </ul>
          )}
        </Section>

        <Section title="Best & worst">
          <Row label="Best sale profit" value={fmt(stats.bestSaleProfit)} good />
          <Row label="Biggest loss" value={fmt(stats.biggestLoss)} bad />
          <Row label="Items bought" value={`${stats.totalBought}`} />
          <Row label="Items sold" value={`${stats.totalSold}`} />
          <Row label="Fees paid" value={fmt(stats.totalFeesPaid)} bad />
          <Row label="Mystery lots opened" value={`${stats.mysteryLotsOpened}`} />
          <Row label="Auctions won" value={`${stats.auctionsWon}`} />
        </Section>
      </div>

      {/* Market events + marketplaces */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Section title="Market events">
          {recentEvents.length === 0 ? (
            <Empty text="Markets are quiet. Events will appear when they pop." />
          ) : (
            <ul className="space-y-1.5">
              {recentEvents.map((n) => (
                <li
                  key={n.id}
                  className="text-sm text-ink-700 flex items-start gap-2 border-l-2 border-ebayYellow-500 pl-3 py-1"
                >
                  <Icon name="sparkle" size={13} className="mt-0.5 shrink-0 text-ebayYellow-600" />
                  <span>{n.message}</span>
                </li>
              ))}
            </ul>
          )}
        </Section>

        <Section title="Marketplaces unlocked">
          <ul className="space-y-1">
            {marketplaces.map((m) => (
              <li
                key={m}
                className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-ink-100"
              >
                <span className="text-sm font-medium text-ink-800">{m}</span>
                <span className="text-[10px] uppercase tracking-widest text-ebayGreen-600 font-bold">
                  Active
                </span>
              </li>
            ))}
          </ul>
          <div className="text-[11px] text-ink-500 pt-2 border-t border-line mt-2">
            Sell at a profit to gain reputation. New marketplaces unlock automatically.
          </div>
        </Section>
      </div>

      {/* Quick links footer */}
      <Section title="Jump to" className="">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
          <QuickLink icon="cart" label="Marketplace" onClick={() => onNavigate('marketplace')} />
          <QuickLink icon="inventory" label={`Inventory (${inventory.length})`} onClick={() => onNavigate('inventory')} />
          <QuickLink icon="tag" label="Storefront" onClick={() => onNavigate('storefront')} />
          <QuickLink icon="shield" label={`Grading (${grading.length})`} onClick={() => onNavigate('grading')} />
          <QuickLink icon="gavel" label="BidGoblin" onClick={() => onNavigate('auctions')} />
          <QuickLink icon="upgrades" label="Upgrades" onClick={() => onNavigate('upgrades')} />
        </div>
      </Section>
    </div>
  );
}

/* ---------- Reusable bits ---------- */

function Section({
  title,
  children,
  className = '',
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-xl border border-line bg-white shadow-card p-4 ${className}`}
    >
      <div className="text-[11px] uppercase tracking-[0.18em] text-ink-500 font-bold mb-3">
        {title}
      </div>
      <div>{children}</div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  accent,
  bold,
}: {
  icon: IconName;
  label: string;
  value: string;
  accent: string;
  bold?: boolean;
}) {
  return (
    <div className="rounded-xl border border-line bg-white shadow-card px-4 py-3 flex items-center gap-3">
      <div className="w-9 h-9 rounded-md bg-feebay-50 text-feebay-600 flex items-center justify-center">
        <Icon name={icon} size={18} />
      </div>
      <div className="min-w-0">
        <div className="text-[10px] uppercase tracking-widest text-ink-500 font-bold">{label}</div>
        <div className={`${bold ? 'text-2xl font-black' : 'text-xl font-bold'} ${accent}`}>
          {value}
        </div>
      </div>
    </div>
  );
}

function BigCTA({
  onClick,
  children,
  primary,
  yellow,
  icon,
}: {
  onClick: () => void;
  children: React.ReactNode;
  primary?: boolean;
  yellow?: boolean;
  icon: IconName;
}) {
  const cls = primary
    ? 'bg-feebay-500 hover:bg-feebay-600 text-white shadow-md shadow-feebay-700/20'
    : yellow
    ? 'bg-ebayYellow-500 hover:bg-ebayYellow-600 text-ink-900 shadow-md shadow-ebayYellow-700/20 animate-pulse'
    : 'bg-white hover:bg-ink-100 text-ink-800 border border-line';
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 h-11 rounded-md text-sm font-bold ${cls}`}
    >
      <Icon name={icon} size={16} />
      {children}
    </button>
  );
}

function QuickLink({
  icon,
  label,
  onClick,
}: {
  icon: IconName;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 px-3 py-2 rounded-md border border-line hover:border-feebay-500 hover:text-feebay-600 text-ink-700 text-sm bg-white"
    >
      <Icon name={icon} size={15} />
      <span className="font-medium">{label}</span>
    </button>
  );
}

function Row({
  label,
  value,
  good,
  bad,
}: {
  label: string;
  value: string;
  good?: boolean;
  bad?: boolean;
}) {
  const cls = good ? 'text-ebayGreen-700' : bad ? 'text-ebayRed-600' : 'text-ink-800';
  return (
    <div className="flex items-center justify-between text-sm border-b border-lineSoft last:border-0 py-1.5">
      <span className="text-ink-500">{label}</span>
      <span className={`font-bold ${cls}`}>{value}</span>
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return <div className="text-sm text-ink-500 py-2">{text}</div>;
}
