import { useGameStore } from '../store/useGameStore';
import { Icon } from './Icon';

export function IntroModal() {
  const seen = useGameStore((s) => s.hasSeenIntro);
  const setSeen = useGameStore((s) => s.setSeenIntro);
  if (seen) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/85 backdrop-blur-sm">
      <div className="w-[min(560px,95vw)] rounded-xl border border-feebay-700 bg-slate-900 p-6 shadow-2xl animate-popIn">
        <div className="text-xs uppercase tracking-widest text-feebay-300">Welcome to FeeBay Simulator</div>
        <h1 className="mt-1 text-2xl font-bold">Buy low. Sell high. Pay weird fees.</h1>
        <p className="mt-3 text-sm text-slate-300">
          You're a small-time online reseller with <span className="font-semibold text-emerald-300">$100</span>, a hunger for hidden gems, and an aversion to scams.
        </p>
        <ol className="mt-4 space-y-2 text-sm text-slate-200 list-decimal pl-5">
          <li>Go to <span className="text-feebay-300 font-semibold">Marketplace</span> and refresh the feed.</li>
          <li>Watch for cheap listings with high estimated value.</li>
          <li><span className="text-amber-200">Mystery lots</span> and <span className="text-amber-200">binders</span> open into multiple cards — sometimes a Mythic.</li>
          <li>Sell raw on <span className="text-feebay-300">FeeBay</span> or grade gems for big multipliers (after unlocking the upgrade).</li>
          <li>Buy <span className="text-feebay-300">Upgrades</span> to reveal value ranges, fake risk, more slots, and trend data.</li>
        </ol>
        <div className="mt-4 rounded border border-amber-700/40 bg-amber-900/20 text-amber-200 text-xs p-3 flex items-start gap-2">
          <Icon name="shield" size={14} className="mt-0.5 shrink-0" />
          <span>
            Heads up: some listings are fakes, scams, or overpriced bag-holder hype. Read the descriptions — they tell you who you're dealing with.
          </span>
        </div>
        <button
          onClick={() => setSeen(true)}
          className="mt-5 w-full rounded bg-feebay-600 hover:bg-feebay-500 py-2 font-semibold"
        >
          Start flipping
        </button>
      </div>
    </div>
  );
}
