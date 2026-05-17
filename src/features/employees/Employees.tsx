import { useEffect, useState } from 'react';
import { useGameStore } from '../../store/useGameStore';
import { getBusinessLevel, getNextBusinessLevel } from '../../data/businessLevels';
import {
  EMPLOYEE_ROLES,
  EMPLOYEE_TIERS,
  employeeCap,
  getEmployeeRole,
  hireCost,
} from '../../data/employees';
import { Icon, type IconName } from '../../components/Icon';
import { ProfitChart } from '../../components/ProfitChart';
import type { Employee, EmployeeLogEntry } from '../../types';

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
                {levelName} — your automation workforce, on the clock for you.
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
      <ProfitChart history={profitHistory} current={companyProfit} />

      {/* Hire panel */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-bold text-ink-800">Hire staff</h2>
          <div className="text-xs text-ink-500">
            {atCap ? (
              <span className="text-ebayYellow-700 font-semibold">
                Team full — promote your business for more slots
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
                  {atCap ? 'Team full' : `Hire — ${fmtMoney(cost)}`}
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
            No employees yet. Hire your first above — a <span className="font-semibold">Scout</span>{' '}
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
            <Icon name={role.icon as IconName} size={20} />
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
            <span className={`font-semibold ${e.idle ? 'text-ebayYellow-700' : 'text-ink-700'}`}>
              {e.idle ? `Idle — ${e.idle}` : role.activity}
            </span>
            <span className="text-ink-400 tabular-nums">
              {e.idle
                ? `rechecks ~${remainingS}s`
                : remainingS > 0
                ? `~${remainingS}s`
                : 'wrapping up…'}
            </span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-ink-100 overflow-hidden">
            <div
              className={`h-full transition-all ${
                e.idle ? 'bg-ebayYellow-500' : 'bg-feebay-500'
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
