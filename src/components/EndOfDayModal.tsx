import { useGameStore } from '../store/useGameStore';
import { Icon } from './Icon';
import { money } from '../game/format';

export function EndOfDayModal() {
  const report = useGameStore((s) => s.pendingEndOfDay);
  const consume = useGameStore((s) => s.consumeEndOfDayReport);
  if (!report) return null;

  const profit = report.netProfit;
  const profitable = profit > 0;
  const cashDelta = report.cashEnd - report.cashStart;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-ink-900/55 backdrop-blur-sm p-4">
      <div className="w-[min(560px,95vw)] rounded-xl border border-line bg-white p-6 shadow-2xl animate-popIn">
        <div className="text-xs uppercase tracking-widest text-ink-500">End of day</div>
        <div className="mt-1 text-2xl font-bold">Day {report.day} wrap-up</div>
        <div className="text-xs text-ink-500 mt-1">
          The lights at the post office shut off. Time to count the day's haul.
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
          <Stat
            label="Cash change"
            value={`${cashDelta >= 0 ? '+' : ''}${money(cashDelta)}`}
            accent={cashDelta >= 0 ? 'text-ebayGreen-600' : 'text-ebayRed-500'}
          />
          <Stat
            label="Net profit"
            value={`${profitable ? '+' : ''}${money(profit)}`}
            accent={profitable ? 'text-ebayGreen-600' : 'text-ebayRed-500'}
          />
          <Stat label="Bought" value={`${report.bought}`} />
          <Stat label="Sold" value={`${report.sold}`} />
          <Stat label="Fees paid" value={money(report.feesPaid)} accent="text-ebayRed-600" />
          <Stat
            label="Best sale today"
            value={`+${money(report.bestSale)}`}
            accent="text-ebayGreen-700"
          />
          <Stat
            label="Worst sale today"
            value={money(report.worstSale)}
            accent="text-ebayRed-600"
          />
          <Stat label="Grades returned" value={`${report.gradesReceived}`} />
        </div>

        {report.newCards > 0 && (
          <div className="mt-4 rounded border border-ebayYellow-500/50 bg-ebayYellow-500/10 text-ebayYellow-700 text-sm px-3 py-2 flex items-center gap-2">
            <Icon name="sparkle" size={14} />
            <span>
              +{report.newCards} new card{report.newCards === 1 ? '' : 's'} added to your collection today.
            </span>
          </div>
        )}

        <button
          onClick={consume}
          className="mt-5 w-full rounded bg-feebay-500 hover:bg-feebay-600 text-white py-2 font-semibold"
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
  accent = 'text-ink-900',
}: {
  label: string;
  value: string;
  accent?: string;
}) {
  return (
    <div className="rounded bg-ink-100 px-3 py-2">
      <div className="text-[10px] uppercase tracking-widest text-ink-500">{label}</div>
      <div className={`font-semibold ${accent}`}>{value}</div>
    </div>
  );
}
