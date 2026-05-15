import { useGameStore } from '../../store/useGameStore';
import { UPGRADES } from '../../data/upgrades';

export function Upgrades() {
  const cash = useGameStore((s) => s.cash);
  const purchased = useGameStore((s) => s.upgradesPurchased);
  const buy = useGameStore((s) => s.purchaseUpgrade);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Upgrades</h1>
        <p className="text-ink-500 text-sm">
          Spend cash on better tools. Each upgrade compounds your edge.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {UPGRADES.map((u) => {
          const owned = purchased.includes(u.id);
          const affordable = cash >= u.cost;
          return (
            <div
              key={u.id}
              className={`rounded-lg border p-4 flex flex-col gap-3 ${
                owned
                  ? 'border-emerald-700/60 bg-ebayGreen-500/10'
                  : 'border-line bg-white shadow-card'
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-semibold text-sm">{u.name}</div>
                  <div className="text-xs text-ink-500 mt-1">{u.description}</div>
                </div>
                <div className="text-xs uppercase tracking-widest text-ink-500 whitespace-nowrap">
                  ${u.cost}
                </div>
              </div>
              <div className="mt-auto">
                {owned ? (
                  <div className="rounded bg-ebayGreen-500/10 text-ebayGreen-700 px-3 py-1.5 text-xs uppercase tracking-widest text-center">
                    Owned
                  </div>
                ) : (
                  <button
                    onClick={() => buy(u.id)}
                    disabled={!affordable}
                    className={`w-full rounded py-1.5 text-sm font-semibold ${
                      affordable
                        ? 'bg-feebay-500 hover:bg-feebay-600 text-white'
                        : 'bg-ink-100 text-ink-400 cursor-not-allowed'
                    }`}
                  >
                    {affordable ? `Buy for $${u.cost}` : `Need $${u.cost}`}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
