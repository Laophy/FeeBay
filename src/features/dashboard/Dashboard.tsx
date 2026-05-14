import { useGameStore } from '../../store/useGameStore';
import { calculateCurrentValue } from '../../game/economyEngine';
import { Sparkline } from '../../components/Sparkline';
import { Icon, type IconName } from '../../components/Icon';
import type { Route } from '../../App';
import { ACHIEVEMENTS } from '../../data/achievements';
import { CARDS } from '../../data/cards';
import { collectionPercent } from '../../game/collection';

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
  const stats = useGameStore((s) => s.stats);
  const grading = useGameStore((s) => s.gradingSubmissions);
  const notes = useGameStore((s) => s.notifications);
  const marketplaces = useGameStore((s) => s.marketplacesUnlocked);
  const samples = useGameStore((s) => s.netWorthSamples);
  const achievementsUnlocked = useGameStore((s) => s.achievementsUnlocked);
  const collection = useGameStore((s) => s.collection);
  const collectionOwned = Object.keys(collection).length;
  const collectionPct = collectionPercent(collection);

  const inventoryValue = inventory.reduce(
    (sum, i) =>
      sum + (i.status === 'grading' ? i.purchasePrice : calculateCurrentValue(i, trends, noise, convention)),
    0,
  );
  const netWorth = cash + inventoryValue;
  const recentEvents = notes.filter((n) => n.kind === 'event').slice(0, 5);
  const recentFlips = notes.filter((n) => n.kind === 'success' || n.kind === 'warning').slice(0, 6);
  const latestAchievement = achievementsUnlocked[achievementsUnlocked.length - 1];
  const latestAchievementDef = ACHIEVEMENTS.find((a) => a.id === latestAchievement);

  return (
    <div className="max-w-6xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-slate-400 text-sm">
          Your reseller HQ. Spot deals. Avoid scams. Flip with confidence (or don't).
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card title="Cash" value={fmt(cash)} accent="text-emerald-400" />
        <Card title="Inventory value" value={fmt(inventoryValue)} accent="text-feebay-300" />
        <Card title="Net worth" value={fmt(netWorth)} accent="text-amber-300" />
        <Card
          title="Lifetime profit"
          value={fmt(stats.totalProfit)}
          accent={stats.totalProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}
        />
        <Card
          title="Collection"
          value={`${collectionOwned}/${CARDS.length} (${collectionPct}%)`}
          accent="text-pink-300"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Panel title="Net worth trend" className="md:col-span-2">
          <Sparkline data={samples} width={640} height={120} />
          <div className="mt-2 text-[11px] text-slate-500">
            Sampled every 5 seconds. Hit $25,000 net worth to unlock Marketplace Mogul.
          </div>
        </Panel>

        <Panel title="Quick actions">
          <QuickAction icon="cart" label="Browse listings" onClick={() => onNavigate('marketplace')} primary />
          <QuickAction
            icon="inventory"
            label={`Inventory (${inventory.length})`}
            onClick={() => onNavigate('inventory')}
          />
          <QuickAction
            icon="shield"
            label={`Grading (${grading.length})`}
            onClick={() => onNavigate('grading')}
          />
          <QuickAction icon="gavel" label="BidGoblin" onClick={() => onNavigate('auctions')} />
          <QuickAction
            icon="box"
            label={`Collection (${collectionOwned}/${CARDS.length})`}
            onClick={() => onNavigate('collection')}
          />
          <QuickAction icon="upgrades" label="Upgrades" onClick={() => onNavigate('upgrades')} />
        </Panel>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Panel title="Best & Worst">
          <Row label="Best sale profit" value={fmt(stats.bestSaleProfit)} good />
          <Row label="Biggest loss" value={fmt(stats.biggestLoss)} bad />
          <Row label="Items bought" value={`${stats.totalBought}`} />
          <Row label="Items sold" value={`${stats.totalSold}`} />
          <Row label="Fees paid" value={fmt(stats.totalFeesPaid)} bad />
          <Row label="Mystery lots opened" value={`${stats.mysteryLotsOpened}`} />
          <Row label="Auctions won" value={`${stats.auctionsWon}`} />
        </Panel>

        <Panel title="Marketplaces unlocked">
          <ul className="space-y-1 text-sm">
            {marketplaces.map((m) => (
              <li key={m} className="flex items-center justify-between">
                <span>{m}</span>
                <span className="text-emerald-400 text-xs">UNLOCKED</span>
              </li>
            ))}
          </ul>
          <div className="text-xs text-slate-500 pt-2 border-t border-slate-800">
            Gain reputation by selling at a profit. New marketplaces unlock automatically.
          </div>
        </Panel>

        <Panel title="Latest achievement">
          {latestAchievementDef ? (
            <div className="rounded border border-amber-500/40 bg-amber-900/20 p-3">
              <Icon name={latestAchievementDef.icon as IconName} size={28} className="text-amber-300" />
              <div className="text-sm font-semibold text-amber-200 mt-2">
                {latestAchievementDef.name}
              </div>
              <div className="text-xs text-slate-400 mt-1">{latestAchievementDef.description}</div>
            </div>
          ) : (
            <div className="text-xs text-slate-400">
              No achievements unlocked yet. Sell something to start.
            </div>
          )}
          <button
            onClick={() => onNavigate('achievements')}
            className="w-full text-xs rounded border border-slate-700 hover:border-slate-500 py-1.5 mt-2"
          >
            View all ({achievementsUnlocked.length}/{ACHIEVEMENTS.length})
          </button>
        </Panel>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Panel title="Market event ticker">
          {recentEvents.length === 0 ? (
            <div className="text-sm text-slate-400">No recent events yet. They'll appear soon.</div>
          ) : (
            <ul className="space-y-1 text-sm">
              {recentEvents.map((n) => (
                <li key={n.id} className="text-purple-200">
                  {n.message}
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title="Recent flips">
          {recentFlips.length === 0 ? (
            <div className="text-sm text-slate-400">No flips yet. Get out there.</div>
          ) : (
            <ul className="space-y-1 text-sm">
              {recentFlips.map((n) => (
                <li
                  key={n.id}
                  className={n.kind === 'success' ? 'text-emerald-200' : 'text-amber-200'}
                >
                  {n.message}
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </div>
  );
}

function Card({ title, value, accent }: { title: string; value: string; accent: string }) {
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-900/60 px-4 py-3">
      <div className="text-[10px] uppercase tracking-widest text-slate-500">{title}</div>
      <div className={`text-xl font-bold ${accent}`}>{value}</div>
    </div>
  );
}

function QuickAction({
  icon,
  label,
  onClick,
  primary,
}: {
  icon: IconName;
  label: string;
  onClick: () => void;
  primary?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-2 rounded py-2 px-3 text-sm font-semibold ${
        primary
          ? 'bg-feebay-600 hover:bg-feebay-500 text-white'
          : 'bg-slate-700/70 hover:bg-slate-700 text-slate-100'
      }`}
    >
      <Icon name={icon} size={16} />
      <span>{label}</span>
    </button>
  );
}

function Panel({
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
      className={`rounded-lg border border-slate-800 bg-slate-900/60 p-4 space-y-3 ${className}`}
    >
      <div className="text-sm font-semibold text-slate-200">{title}</div>
      <div className="space-y-2">{children}</div>
    </div>
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
  const cls = good ? 'text-emerald-300' : bad ? 'text-rose-300' : 'text-slate-200';
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-slate-400">{label}</span>
      <span className={`font-semibold ${cls}`}>{value}</span>
    </div>
  );
}
