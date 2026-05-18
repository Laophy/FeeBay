import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useGameStore } from '../../store/useGameStore';
import { getBusinessLevel, getNextBusinessLevel } from '../../data/businessLevels';
import {
  EMPLOYEE_ROLES,
  EMPLOYEE_TIERS,
  OVERHEAD_LINES,
  employeeCap,
  getEmployeeRole,
  hireCost,
} from '../../data/employees';
import { Icon, type IconName } from '../../components/Icon';
import { LiveChart } from '../../components/LiveChart';
import { CardArt } from '../../components/CardArt';
import type { CardFlowEntry, Employee, EmployeeLogEntry, InventoryItem } from '../../types';

function fmtMoney(n: number): string {
  const a = Math.abs(Math.round(n));
  return `${n < 0 ? '-' : ''}$${a.toLocaleString()}`;
}

function tierStars(stars: number): string {
  return '★'.repeat(stars) + '☆'.repeat(Math.max(0, 3 - stars));
}

export function Employees() {
  const employees = useGameStore((s) => s.employees);
  const businessLevel = useGameStore((s) => s.businessLevel);
  const cash = useGameStore((s) => s.cash);
  const hireEmployee = useGameStore((s) => s.hireEmployee);
  const companyProfit = useGameStore((s) => s.companyProfit);
  const profitHistory = useGameStore((s) => s.companyProfitHistory);
  const cardFlow = useGameStore((s) => s.cardFlow);
  const inventory = useGameStore((s) => s.inventory);
  const claimStockItem = useGameStore((s) => s.claimStockItem);
  const operatingCosts = useGameStore((s) => s.operatingCosts);

  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(id);
  }, []);

  if (businessLevel < 2) {
    return (
      <div className="rounded-lg border border-dashed border-line p-10 text-center text-ink-500">
        Employees unlock at <span className="font-semibold text-ink-700">Business Level 2</span>.
        Keep flipping to get there.
      </div>
    );
  }

  const cap = employeeCap(businessLevel);
  const cost = hireCost(employees.length);
  const atCap = employees.length >= cap;
  const levelName = getBusinessLevel(businessLevel).name;
  const next = getNextBusinessLevel(businessLevel);

  const totalActions = employees.reduce((s, e) => s + e.actions, 0);
  const totalMistakes = employees.reduce((s, e) => s + e.mistakes, 0);
  const totalMistakeCost = employees.reduce((s, e) => s + e.mistakeCost, 0);
  const stockItems = inventory.filter((i) => i.autoBought);

  return (
    <div className="space-y-5">
      {/* Company HQ header */}
      <div className="rounded-xl border border-line bg-white shadow-card overflow-hidden">
        <div className="flex items-center justify-between flex-wrap gap-3 px-5 py-4 bg-gradient-to-r from-feebay-50 to-white border-b border-line">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-lg bg-feebay-500 text-white flex items-center justify-center shrink-0">
              <Icon name="users" size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-black leading-none text-ink-900">Your Company</h1>
              <p className="text-ink-500 text-sm mt-1">
                {levelName} - your automation workforce, on the clock for you.
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-[10px] uppercase tracking-widest text-ink-500 font-bold">
              Headcount
            </div>
            <div className="text-2xl font-black text-ink-900">
              {employees.length}
              <span className="text-ink-400 text-lg"> / {cap}</span>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-line">
          <HqStat
            label="Profit generated"
            value={fmtMoney(companyProfit)}
            accent={companyProfit >= 0 ? 'text-ebayGreen-600' : 'text-ebayRed-500'}
          />
          <HqStat label="Tasks completed" value={totalActions.toLocaleString()} accent="text-ink-900" />
          <HqStat
            label="Mistakes"
            value={`${totalMistakes}`}
            sub={totalMistakeCost > 0 ? `${fmtMoney(-totalMistakeCost)} lost` : 'clean record'}
            accent={totalMistakes > 0 ? 'text-ebayRed-500' : 'text-ebayGreen-600'}
          />
          <HqStat
            label="Roster slots"
            value={`${cap - employees.length} open`}
            sub={atCap && next ? `Promote to ${next.name} for more` : `Cap ${cap}`}
            accent="text-feebay-600"
          />
        </div>
      </div>

      {/* Live company-profit chart */}
      <LiveChart
        title="Company profit · live"
        history={profitHistory}
        current={companyProfit}
      />

      {/* Operating costs ledger */}
      <OperatingCosts costs={operatingCosts} />

      {/* Hire panel */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-bold text-ink-800">Hire staff</h2>
          <div className="text-xs text-ink-500">
            {atCap ? (
              <span className="text-ebayYellow-700 font-semibold">
                Team full - promote your business for more slots
              </span>
            ) : (
              <>
                Next hire: <span className="font-bold text-ink-900">{fmtMoney(cost)}</span>
              </>
            )}
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
          {EMPLOYEE_ROLES.map((r) => {
            const affordable = cash >= cost;
            const canHire = !atCap && affordable;
            return (
              <div
                key={r.id}
                className="rounded-lg border border-line bg-white shadow-card p-3 flex flex-col"
              >
                <div className="flex items-center gap-2">
                  <div
                    className={`w-8 h-8 rounded-md bg-ink-100 flex items-center justify-center ${r.accent}`}
                  >
                    <Icon name={r.icon as IconName} size={16} />
                  </div>
                  <div className={`font-bold text-sm ${r.accent}`}>{r.title}</div>
                </div>
                <p className="text-[11px] text-ink-500 mt-1.5 leading-snug flex-1">{r.blurb}</p>
                <button
                  onClick={() => hireEmployee(r.id)}
                  disabled={!canHire}
                  className={`mt-2.5 rounded-md py-1.5 text-xs font-bold ${
                    canHire
                      ? 'bg-feebay-500 hover:bg-feebay-600 text-white'
                      : 'bg-ink-100 text-ink-400 cursor-not-allowed'
                  }`}
                >
                  {atCap ? 'Team full' : `Hire - ${fmtMoney(cost)}`}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Roster */}
      <div>
        <h2 className="text-sm font-bold text-ink-800 mb-2">
          Roster {employees.length > 0 && <span className="text-ink-400">({employees.length})</span>}
        </h2>
        {employees.length === 0 ? (
          <div className="rounded-lg border border-dashed border-line p-10 text-center text-ink-500">
            No employees yet. Hire your first above - a <span className="font-semibold">Scout</span>{' '}
            to buy stock and a <span className="font-semibold">Flipper</span> to sell it is a solid
            start.
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {employees.map((e) => (
              <EmployeeCard key={e.id} employee={e} now={now} />
            ))}
          </div>
        )}
      </div>

      {/* Cards flowing through the store */}
      <CardFlow flow={cardFlow} />

      {/* Store stock - Scout-sourced cards waiting on a Flipper */}
      <StoreStock items={stockItems} onClaim={claimStockItem} />
    </div>
  );
}

function HqStat({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string;
  sub?: string;
  accent: string;
}) {
  return (
    <div className="bg-white px-4 py-3">
      <div className="text-[10px] uppercase tracking-widest text-ink-500 font-bold">{label}</div>
      <div className={`text-xl font-black leading-tight ${accent}`}>{value}</div>
      {sub && <div className="text-[10px] text-ink-400">{sub}</div>}
    </div>
  );
}

function EmployeeCard({ employee: e, now }: { employee: Employee; now: number }) {
  const fire = useGameStore((s) => s.fireEmployee);
  const [showLog, setShowLog] = useState(false);
  const role = getEmployeeRole(e.role);
  const tier = EMPLOYEE_TIERS[e.tier];

  const span = Math.max(1, e.cycleEndsAt - e.cycleStartedAt);
  const pct = Math.min(100, Math.max(0, ((now - e.cycleStartedAt) / span) * 100));
  const remainingS = Math.max(0, Math.ceil((e.cycleEndsAt - now) / 1000));
  const last = e.log[0];

  return (
    <div className="rounded-lg border border-line bg-white shadow-card overflow-hidden">
      <div className="p-3">
        <div className="flex items-start gap-3">
          <div
            className={`w-10 h-10 rounded-lg bg-ink-100 flex items-center justify-center shrink-0 ${role.accent}`}
          >
            <Icon name={e.break ? 'coffee' : (role.icon as IconName)} size={20} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-bold text-ink-900 truncate">{e.name}</span>
              <span className="text-[10px] text-ebayYellow-500" title={tier.label}>
                {tierStars(tier.stars)}
              </span>
            </div>
            <div className="text-[11px] text-ink-500">
              <span className={`font-semibold ${role.accent}`}>{role.title}</span>
              <span className="text-ink-300"> · </span>
              {tier.label}
            </div>
          </div>
          <button
            onClick={() => {
              if (window.confirm(`Let ${e.name} go? No refund on the hire.`)) fire(e.id);
            }}
            className="shrink-0 text-ink-400 hover:text-ebayRed-500 p-1 rounded hover:bg-ink-100"
            title="Fire employee"
          >
            <Icon name="x" size={14} />
          </button>
        </div>

        {/* Current task + progress */}
        <div className="mt-2.5">
          <div className="flex items-center justify-between text-[11px] mb-1">
            <span
              className={`font-semibold ${
                e.break ? 'text-ink-500' : e.idle ? 'text-ebayYellow-700' : 'text-ink-700'
              }`}
            >
              {e.break ? `On break - ${e.break}` : e.idle ? `Idle - ${e.idle}` : role.activity}
            </span>
            <span className="text-ink-400 tabular-nums">
              {e.break
                ? `back ~${remainingS}s`
                : e.idle
                ? `rechecks ~${remainingS}s`
                : remainingS > 0
                ? `~${remainingS}s`
                : 'wrapping up…'}
            </span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-ink-100 overflow-hidden">
            <div
              className={`h-full transition-all ${
                e.break ? 'bg-ink-300' : e.idle ? 'bg-ebayYellow-500' : 'bg-feebay-500'
              }`}
              style={{ width: `${pct}%` }}
            />
          </div>
          <div className="text-[11px] text-ink-500 mt-1.5 truncate">
            {last ? (
              <>
                <span className="text-ink-400">Last: </span>
                <span className={last.kind === 'mistake' ? 'text-ebayRed-500' : 'text-ink-700'}>
                  {last.text}
                </span>
              </>
            ) : (
              <span className="text-ink-400 italic">Just clocked in.</span>
            )}
          </div>
        </div>

        {/* Lifetime tallies */}
        <div className="grid grid-cols-3 gap-2 mt-3">
          <MiniStat
            label="Profit"
            value={fmtMoney(e.profit)}
            accent={e.profit >= 0 ? 'text-ebayGreen-600' : 'text-ebayRed-500'}
          />
          <MiniStat label="Tasks" value={`${e.actions}`} accent="text-ink-900" />
          <MiniStat
            label="Mistakes"
            value={`${e.mistakes}`}
            accent={e.mistakes > 0 ? 'text-ebayRed-500' : 'text-ink-400'}
          />
        </div>

        <button
          onClick={() => setShowLog((v) => !v)}
          className="mt-2 w-full text-[11px] font-semibold text-feebay-600 hover:text-feebay-700 flex items-center justify-center gap-1"
        >
          <Icon name={showLog ? 'minus' : 'plus'} size={11} />
          {showLog ? 'Hide history' : `History (${e.log.length})`}
        </button>
      </div>

      {showLog && (
        <div className="border-t border-line bg-paper max-h-52 overflow-y-auto">
          {e.log.length === 0 ? (
            <div className="px-3 py-4 text-center text-[11px] text-ink-400">
              No activity logged yet.
            </div>
          ) : (
            e.log.map((entry) => <LogRow key={entry.id} entry={entry} now={now} />)
          )}
        </div>
      )}
    </div>
  );
}

function MiniStat({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <div className="rounded-md bg-paper border border-line px-2 py-1.5 text-center">
      <div className="text-[9px] uppercase tracking-widest text-ink-400 font-bold">{label}</div>
      <div className={`text-xs font-black ${accent}`}>{value}</div>
    </div>
  );
}

function LogRow({ entry, now }: { entry: EmployeeLogEntry; now: number }) {
  const ago = Math.max(0, Math.floor((now - entry.at) / 1000));
  const agoText =
    ago < 60 ? `${ago}s` : ago < 3600 ? `${Math.floor(ago / 60)}m` : `${Math.floor(ago / 3600)}h`;
  const icon: IconName =
    entry.kind === 'mistake'
      ? 'bolt'
      : entry.kind === 'flip'
      ? 'tag'
      : entry.kind === 'buy'
      ? 'search'
      : entry.kind === 'break'
      ? 'coffee'
      : 'sparkle';
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 border-b border-lineSoft last:border-b-0 text-[11px]">
      <Icon
        name={icon}
        size={11}
        className={entry.kind === 'mistake' ? 'text-ebayRed-500' : 'text-ink-400'}
      />
      <span className={`flex-1 truncate ${entry.kind === 'mistake' ? 'text-ebayRed-600' : 'text-ink-700'}`}>
        {entry.text}
      </span>
      {entry.amount !== 0 && (
        <span
          className={`font-bold tabular-nums ${
            entry.amount >= 0 ? 'text-ebayGreen-600' : 'text-ebayRed-500'
          }`}
        >
          {entry.amount >= 0 ? '+' : ''}
          {fmtMoney(entry.amount)}
        </span>
      )}
      <span className="text-ink-300 w-7 text-right">{agoText}</span>
    </div>
  );
}

/* ---------- Card flow belt ---------- */

function CardFlow({ flow }: { flow: CardFlowEntry[] }) {
  // Only render entries that carry a real card id (stale ones lack art data).
  const cards = flow.filter((e) => !!e.cardId);
  const newestId = cards[0]?.id;

  // Replay the slide-in only when a genuinely new card lands on the belt.
  const [animId, setAnimId] = useState(0);
  const seenRef = useRef<string | undefined>(newestId);
  useEffect(() => {
    if (newestId && newestId !== seenRef.current) {
      seenRef.current = newestId;
      setAnimId((n) => n + 1);
    }
  }, [newestId]);

  // Measure the belt so it fills the container at any screen width - a fixed
  // slot count leaves a gap on wide screens.
  const beltRef = useRef<HTMLDivElement>(null);
  const [beltWidth, setBeltWidth] = useState(0);
  useLayoutEffect(() => {
    const el = beltRef.current;
    if (!el) return;
    const measure = () => setBeltWidth(el.clientWidth);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  // 76px per slot (64px card + 12px gap); enough slots to always overflow.
  const slotCount = Math.max(16, Math.ceil((beltWidth - 48) / 76) + 1);

  return (
    <div className="rounded-xl border border-line bg-white shadow-card overflow-hidden">
      <div className="px-5 pt-4">
        <div className="text-[10px] uppercase tracking-widest text-ink-500 font-bold">
          Cards moving through the store
        </div>
        <div className="text-sm text-ink-500">
          Live stock history - every card your team has bought in and flipped back out.
        </div>
      </div>
      <div ref={beltRef} className="relative overflow-hidden py-3 mt-2">
        {cards.length === 0 ? (
          <div className="h-24 flex items-center justify-center text-center text-[12px] text-ink-400 px-6">
            Nothing's moved through yet - hire a Scout and a Flipper, then watch the belt fill up.
          </div>
        ) : (
          <>
            <div key={animId} className="card-flow-row flex gap-3 pl-12 pr-3">
              {Array.from({ length: slotCount }).map((_, i) => {
                const entry = cards[i];
                return entry ? (
                  <FlowCard key={entry.id} entry={entry} fresh={i === 0} />
                ) : (
                  <FlowEmptySlot key={`slot-${i}`} />
                );
              })}
            </div>
            {/* Entry marker - new cards slide in from here */}
            <div className="absolute left-0 top-0 bottom-0 w-11 z-10 pointer-events-none flex flex-col items-center justify-center gap-0.5 bg-gradient-to-r from-white via-white to-transparent">
              <span className="text-[7px] font-black uppercase tracking-wider text-feebay-600">
                New
              </span>
              <span className="text-feebay-500 text-base leading-none animate-pulse">▸</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function FlowCard({ entry, fresh }: { entry: CardFlowEntry; fresh: boolean }) {
  const sourced = entry.kind === 'sourced';
  const amountText = sourced
    ? `$${Math.round(entry.amount).toLocaleString()}`
    : `${entry.amount >= 0 ? '+' : '-'}$${Math.abs(Math.round(entry.amount)).toLocaleString()}`;
  const tone = sourced
    ? 'text-feebay-600'
    : entry.amount >= 0
    ? 'text-ebayGreen-600'
    : 'text-ebayRed-500';
  return (
    <div className="shrink-0 w-16 flex flex-col items-center gap-1">
      <div className={`rounded-md ${fresh ? 'ring-2 ring-feebay-400 ring-offset-1' : ''}`}>
        <CardArt
          small
          animated={false}
          name={entry.name}
          rarity={entry.rarity}
          hue={entry.hue}
          cardId={entry.cardId}
          grade={entry.grade}
          gradingCompany={entry.gradingCompany}
          centeringOffsetX={entry.centeringOffsetX}
          centeringOffsetY={entry.centeringOffsetY}
        />
      </div>
      <div
        className={`flex items-center gap-1 text-[9px] font-bold uppercase tracking-wide ${tone}`}
      >
        <Icon name={sourced ? 'cart' : 'tag'} size={9} />
        <span className="tabular-nums">{amountText}</span>
      </div>
    </div>
  );
}

/** An empty belt slot — keeps the flow belt a full, even width before it fills. */
function FlowEmptySlot() {
  return (
    <div className="shrink-0 w-16 flex flex-col items-center gap-1" aria-hidden>
      <div className="w-16 h-24 rounded-md border border-dashed border-line bg-ink-100" />
      <div className="h-3" />
    </div>
  );
}

/* ---------- Store stock ---------- */

function StoreStock({
  items,
  onClaim,
}: {
  items: InventoryItem[];
  onClaim: (id: string) => void;
}) {
  const totalWorth = items.reduce((s, i) => s + (i.baseValue ?? 0), 0);
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-sm font-bold text-ink-800">
          Store stock{' '}
          {items.length > 0 && <span className="text-ink-400">({items.length})</span>}
        </h2>
        {items.length > 0 && (
          <div className="text-xs text-ink-500">
            ~<span className="font-bold text-ink-900">{fmtMoney(totalWorth)}</span> on the shelf
          </div>
        )}
      </div>
      {items.length === 0 ? (
        <div className="rounded-lg border border-dashed border-line p-8 text-center text-ink-500 text-sm">
          No stock on the shelf. Cards your Scouts source land here until a Flipper sells them -
          pull anything you'd rather keep for yourself.
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3 max-h-[470px] overflow-y-auto pr-1">
          {items.map((it) => (
            <div
              key={it.id}
              className="rounded-lg border border-line bg-white shadow-card p-2 flex flex-col items-center gap-1.5"
            >
              <CardArt
                small
                animated={false}
                name={it.name}
                rarity={it.rarity}
                hue={it.hue}
                cardId={it.cardId}
                grade={it.grade}
                gradingCompany={it.gradingCompany}
                centeringOffsetX={it.centeringOffsetX}
                centeringOffsetY={it.centeringOffsetY}
              />
              <div className="text-[11px] font-semibold text-ink-800 text-center leading-tight line-clamp-2 w-full">
                {it.name}
              </div>
              <div className="text-[10px] text-ink-500 text-center leading-tight">
                paid ${Math.round(it.purchasePrice).toLocaleString()} · worth ~
                {fmtMoney(it.baseValue ?? 0)}
              </div>
              <button
                onClick={() => onClaim(it.id)}
                className="w-full rounded-md border border-line hover:border-feebay-500 hover:text-feebay-600 text-ink-700 text-[11px] font-bold py-1.5"
              >
                Pull out
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ---------- Operating costs ledger ---------- */

function OperatingCosts({ costs }: { costs: Record<string, number> }) {
  const total = OVERHEAD_LINES.reduce((s, l) => s + (costs[l.id] ?? 0), 0);
  return (
    <div className="rounded-xl border border-line bg-white shadow-card p-4">
      <div className="text-[10px] uppercase tracking-widest text-ink-500 font-bold">
        Operating costs
      </div>
      <div className="text-sm text-ink-500 mb-2.5">
        Shipping, protection and prep the company eats on every card it sells.
      </div>
      <div className="divide-y divide-lineSoft">
        {OVERHEAD_LINES.map((l) => (
          <div key={l.id} className="flex items-center justify-between py-1.5 text-sm">
            <span className="text-ink-600">{l.label}</span>
            <span className="font-semibold text-ink-800 tabular-nums">
              {fmtMoney(costs[l.id] ?? 0)}
            </span>
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between pt-2.5 mt-1 border-t border-line">
        <span className="text-sm font-bold text-ink-800">Total overhead</span>
        <span className="text-base font-black text-ebayRed-500 tabular-nums">
          {fmtMoney(-total)}
        </span>
      </div>
    </div>
  );
}
