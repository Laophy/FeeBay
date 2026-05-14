import { useGameStore } from '../store/useGameStore';
import { Icon } from './Icon';

export function EndOfDayModal() {
  const report = useGameStore((s) => s.pendingEndOfDay);
  const consume = useGameStore((s) => s.consumeEndOfDayReport);
  if (!report) return null;

  const profit = report.netProfit;
  const profitable = profit > 0;
  const cashDelta = report.cashEnd - report.cashStart;

  return (
    <div className="fixed inset-0 z-[65] flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="w-[min(560px,95vw)] rounded-xl border border-slate-700 bg-slate-900 p-6 shadow-2xl animate-popIn">
        <div className="text-xs uppercase tracking-widest text-slate-400">End of day</div>
        <div className="mt-1 text-2xl font-bold">Day {report.day} wrap-up</div>
        <div className="text-xs text-slate-400 mt-1">
          The lights at the post office shut off. Time to count the day's haul.
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
          <Stat
            label="Cash change"
            value={`${cashDelta >= 0 ? '+' : ''}$${cashDelta.toFixed(2)}`}
            accent={cashDelta >= 0 ? 'text-emerald-300' : 'text-rose-300'}
          />
          <Stat
            label="Net profit"
            value={`${profitable ? '+' : ''}$${profit.toFixed(2)}`}
            accent={profitable ? 'text-emerald-300' : 'text-rose-300'}
          />
          <Stat label="Bought" value={`${report.bought}`} />
          <Stat label="Sold" value={`${report.sold}`} />
          <Stat label="Fees paid" value={`$${report.feesPaid.toFixed(2)}`} accent="text-rose-200" />
          <Stat
            label="Best sale today"
            value={`+$${report.bestSale.toFixed(2)}`}
            accent="text-emerald-200"
          />
          <Stat
            label="Worst sale today"
            value={`$${report.worstSale.toFixed(2)}`}
            accent="text-rose-200"
          />
          <Stat label="Grades returned" value={`${report.gradesReceived}`} />
        </div>

        {report.newCards > 0 && (
          <div className="mt-4 rounded border border-amber-500/40 bg-amber-900/20 text-amber-200 text-sm px-3 py-2 flex items-center gap-2">
            <Icon name="sparkle" size={14} />
            <span>
              +{report.newCards} new card{report.newCards === 1 ? '' : 's'} added to your collection today.
            </span>
          </div>
        )}

        <button
          onClick={consume}
          className="mt-5 w-full rounded bg-feebay-600 hover:bg-feebay-500 py-2 font-semibold"
        >
          Start day {report.day + 1}
        </button>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  accent = 'text-slate-100',
}: {
  label: string;
  value: string;
  accent?: string;
}) {
  return (
    <div className="rounded bg-slate-800/70 px-3 py-2">
      <div className="text-[10px] uppercase tracking-widest text-slate-400">{label}</div>
      <div className={`font-semibold ${accent}`}>{value}</div>
    </div>
  );
}
