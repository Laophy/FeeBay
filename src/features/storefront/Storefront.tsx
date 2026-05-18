import { useEffect, useState } from 'react';
import { useGameStore, storefrontFeeBreakdown } from '../../store/useGameStore';
import { CardArt } from '../../components/CardArt';
import { getCardById } from '../../data/cards';
import { saleProbabilityPerTick } from '../../game/storefront';
import { Icon } from '../../components/Icon';
import { money } from '../../game/format';

export function Storefront() {
  const listings = useGameStore((s) => s.playerListings);
  const inventory = useGameStore((s) => s.inventory);
  const delist = useGameStore((s) => s.delistFromStorefront);
  const history = useGameStore((s) => s.storefrontHistory);
  const pending = useGameStore((s) => s.pendingPayments);
  const balance = useGameStore((s) => s.storefrontBalance);
  const autoWithdraw = useGameStore((s) => s.autoWithdrawEnabled);
  const upgrades = useGameStore((s) => s.upgradesPurchased);
  const withdraw = useGameStore((s) => s.withdrawStorefront);
  const setAutoWithdraw = useGameStore((s) => s.setAutoWithdraw);
  const stats = useGameStore((s) => s.stats);
  const autoWithdrawUnlocked = upgrades.includes('auto_withdraw');

  const totalListedValue = listings.reduce((s, l) => s + l.askingPrice, 0);
  const pendingValue = pending.reduce((s, p) => s + (p.willCancel ? 0 : p.netRevenue), 0);
  const totalSalesCount = stats.storefrontSales;
  const totalSalesRevenue = stats.storefrontRevenue ?? 0;
  const businessLevel = useGameStore((s) => s.businessLevel);
  const feeBreakdown = storefrontFeeBreakdown({ upgradesPurchased: upgrades, businessLevel });
  const feeRate = feeBreakdown.rate;
  const previewFee = +(balance * feeRate).toFixed(2);
  const previewNet = +(balance - previewFee).toFixed(2);

  const [, force] = useState(0);
  useEffect(() => {
    const id = setInterval(() => force((x) => x + 1), 1000);
    return () => clearInterval(id);
  }, []);

  function fmtRelative(t: number): string {
    const sec = Math.max(0, (Date.now() - t) / 1000);
    if (sec < 60) return `${Math.floor(sec)}s ago`;
    if (sec < 3600) return `${Math.floor(sec / 60)}m ago`;
    if (sec < 86400) return `${Math.floor(sec / 3600)}h ago`;
    return `${Math.floor(sec / 86400)}d ago`;
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Your Storefront</h1>
        <p className="text-ink-500 text-sm">
          Cards you've listed at your chosen prices. Buyers nibble probabilistically — list close to value for steady sales, list above for jackpot odds.
        </p>
      </div>

      {/* Wallet + stats */}
      <div className="rounded-xl border border-line bg-white shadow-card overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto]">
          <div className="grid grid-cols-3 divide-x divide-lineSoft">
            <WalletStat
              icon="chart-up"
              label="Total sales"
              value={money(totalSalesRevenue)}
              sub={`${totalSalesCount} order${totalSalesCount === 1 ? '' : 's'} · ${listings.length} active · ${pending.length} pending`}
              accent="text-ebayGreen-700"
            />
            <WalletStat
              icon="tag"
              label="Listed value"
              value={money(totalListedValue)}
              sub="Sum of active asking prices"
              accent="text-feebay-700"
            />
            <WalletStat
              icon="wallet"
              label="In transit"
              value={money(pendingValue)}
              sub="Buyers about to pay"
              accent="text-ebayYellow-700"
            />
          </div>

          <div className="bg-gradient-to-br from-ebayGreen-500/10 via-white to-white border-t lg:border-t-0 lg:border-l border-lineSoft p-4 flex flex-col gap-3 lg:min-w-[320px]">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-md bg-ebayGreen-500 text-white flex items-center justify-center shadow-sm">
                <Icon name="wallet" size={18} />
              </div>
              <div className="min-w-0">
                <div className="text-[10px] uppercase tracking-widest font-bold text-ink-500">
                  Storefront wallet
                </div>
                <div className="text-2xl font-black text-ebayGreen-700 tabular-nums leading-none mt-0.5">
                  {money(balance)}
                </div>
              </div>
            </div>
            <div className="rounded-md border border-line bg-paper px-3 py-2 text-[11px] space-y-0.5">
              <div className="flex items-center justify-between">
                <span className="text-ink-500 inline-flex items-center gap-1">
                  <Icon name="tag" size={11} />
                  FeeBay fee
                  <span
                    className="text-ink-400"
                    title={`Base 14%${
                      feeBreakdown.upgradeReduction > 0
                        ? ` − ${(feeBreakdown.upgradeReduction * 100).toFixed(0)}% upgrades`
                        : ''
                    }${
                      feeBreakdown.businessDiscount > 0
                        ? ` − ${(feeBreakdown.businessDiscount * 100).toFixed(0)}% business level`
                        : ''
                    }`}
                  >
                    ({(feeRate * 100).toFixed(2).replace(/\.?0+$/, '')}%)
                  </span>
                </span>
                <span className="font-bold text-ebayRed-500 tabular-nums">
                  −{money(previewFee)}
                </span>
              </div>
              {(feeBreakdown.upgradeReduction > 0 || feeBreakdown.businessDiscount > 0) && (
                <div className="flex items-center justify-between text-ink-400">
                  <span className="inline-flex items-center gap-1">
                    <Icon name="sparkle" size={10} />
                    Discounts
                  </span>
                  <span className="tabular-nums">
                    {feeBreakdown.upgradeReduction > 0 && (
                      <span className="text-ebayGreen-700 font-semibold">
                        −{(feeBreakdown.upgradeReduction * 100).toFixed(0)}% upgrades
                      </span>
                    )}
                    {feeBreakdown.upgradeReduction > 0 && feeBreakdown.businessDiscount > 0 && (
                      <span className="text-ink-300 mx-1">·</span>
                    )}
                    {feeBreakdown.businessDiscount > 0 && (
                      <span className="text-ebayYellow-700 font-semibold">
                        −{(feeBreakdown.businessDiscount * 100).toFixed(0)}% biz lv{businessLevel}
                      </span>
                    )}
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between border-t border-lineSoft pt-1 mt-1">
                <span className="text-ink-700 font-semibold">You receive</span>
                <span className="font-black text-ink-900 tabular-nums">
                  {money(previewNet)}
                </span>
              </div>
            </div>
            <button
              onClick={withdraw}
              disabled={balance <= 0}
              className={`w-full rounded-md py-2 text-sm font-bold uppercase tracking-widest transition border-2 ${
                balance > 0
                  ? 'bg-ebayGreen-500 hover:bg-ebayGreen-600 text-white border-ebayGreen-600 shadow-sm'
                  : 'bg-ink-100 text-ink-400 border-line cursor-not-allowed'
              }`}
            >
              {balance > 0 ? `Withdraw ${money(previewNet)}` : 'Nothing to withdraw'}
            </button>
            <label
              className={`flex items-center justify-between gap-3 rounded-md border px-3 py-2 ${
                autoWithdrawUnlocked
                  ? 'border-line bg-paper cursor-pointer'
                  : 'border-dashed border-line bg-paper opacity-70 cursor-not-allowed'
              }`}
              title={
                autoWithdrawUnlocked
                  ? 'When on, sales deposit straight into your cash.'
                  : 'Buy the Auto-Withdraw upgrade to enable this.'
              }
            >
              <div className="min-w-0">
                <div className="text-xs font-bold text-ink-900 flex items-center gap-1.5">
                  <Icon name="bolt" size={12} className="text-feebay-600" />
                  Auto-withdraw
                  {!autoWithdrawUnlocked && (
                    <span className="ml-1 text-[9px] uppercase tracking-widest text-ink-400 font-bold inline-flex items-center gap-0.5">
                      <Icon name="lock" size={9} /> upgrade
                    </span>
                  )}
                </div>
                <div className="text-[10px] text-ink-500">
                  {autoWithdrawUnlocked
                    ? autoWithdraw
                      ? 'On — sales deposit instantly.'
                      : 'Off — sales stack in your wallet.'
                    : 'Locked. See Upgrades.'}
                </div>
              </div>
              <Toggle
                checked={autoWithdrawUnlocked && autoWithdraw}
                disabled={!autoWithdrawUnlocked}
                onChange={(v) => setAutoWithdraw(v)}
              />
            </label>
          </div>
        </div>
      </div>

      {listings.length === 0 ? (
        <div className="rounded border border-dashed border-line p-10 text-center text-ink-500">
          You have no active listings. Open an Inventory card and click &quot;List for sale&quot; to put it on the storefront.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {listings.map((l) => {
            const item = inventory.find((i) => i.id === l.itemId);
            if (!item) return null;
            const card = getCardById(item.cardId);
            const now = Date.now();
            const timeLeftMs = Math.max(0, l.expiresAt - now);
            const totalMs = l.expiresAt - l.listedAt;
            const elapsedPct = Math.min(100, ((totalMs - timeLeftMs) / totalMs) * 100);
            const probPerTick = saleProbabilityPerTick(l.askingPrice, l.refValue, l.marketplace);
            const probPerMin = Math.min(0.99, 1 - Math.pow(1 - probPerTick, 6));
            const ratio = l.askingPrice / l.refValue;
            return (
              <div key={l.id} className="rounded-lg border border-line bg-white shadow-card p-3 flex flex-col gap-3">
                <div className="flex items-start gap-3">
                  <CardArt
                    name={card.name}
                    rarity={card.rarity}
                    hue={card.hue}
                    cardId={card.id}
                    grade={item.grade}
                    gradingCompany={item.gradingCompany}
                    centeringOffsetX={item.centeringOffsetX}
                    centeringOffsetY={item.centeringOffsetY}
                    small
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold truncate">{card.name}</div>
                    <div className="text-xs text-ink-500">
                      {item.rarity} • {item.rawCondition} • on {l.marketplace}
                    </div>
                    <div className="mt-2 text-xs flex items-center gap-2">
                      <span className="text-ink-500">Price</span>
                      <span className="text-ebayGreen-600 font-semibold">{money(l.askingPrice)}</span>
                      <span className="text-ink-400">vs ref {money(l.refValue)}</span>
                    </div>
                    <div className="text-[11px] text-ink-500 mt-0.5">
                      ratio {ratio.toFixed(2)}× • est{' '}
                      <span
                        className={
                          probPerMin > 0.4
                            ? 'text-ebayGreen-600'
                            : probPerMin > 0.1
                            ? 'text-ebayYellow-700'
                            : 'text-ebayRed-500'
                        }
                      >
                        {(probPerMin * 100).toFixed(0)}%/min chance
                      </span>
                    </div>
                  </div>
                </div>

                <div className="h-1.5 w-full rounded-full bg-ink-100 overflow-hidden">
                  <div
                    className="h-full bg-amber-500/70"
                    style={{ width: `${elapsedPct}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-[11px] text-ink-500">
                  <span>{Math.ceil(timeLeftMs / 1000)}s remaining</span>
                  <button
                    onClick={() => delist(l.id)}
                    className="rounded border border-line hover:border-rose-500 hover:text-ebayRed-500 px-2 py-1 text-[11px]"
                  >
                    Delist
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="rounded border border-line bg-white shadow-card text-xs text-ink-500 p-3 flex items-start gap-2">
        <Icon name="tag" size={14} className="mt-0.5 shrink-0 text-ink-400" />
        <span>
          Listing at your <span className="text-ink-800">reference value</span> gives roughly a 15% sale chance per minute.
          List under value for fast flips, over value for jackpot prices but more risk of expiring.
          Listings expire after 8 minutes and return to your inventory. Buyers don't always pay instantly — 60% pay on the spot,
          30% delay, 10% will cancel and you get your card back (but lose the time).
        </span>
      </div>

      {/* Pending payments */}
      {pending.length > 0 && (
        <div className="rounded-xl border border-feebay-500/40 bg-feebay-50 shadow-card p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-md bg-feebay-500/20 text-feebay-700 flex items-center justify-center">
                <Icon name="wallet" size={18} />
              </div>
              <div>
                <div className="font-black text-ink-900">Awaiting payment</div>
                <div className="text-xs text-ink-500">
                  Buyers clicked Buy. Some pay quickly, some slow-walk it, some bail entirely.
                </div>
              </div>
            </div>
            <div className="text-[10px] uppercase tracking-widest font-bold text-feebay-700">
              {pending.length} pending
            </div>
          </div>
          <ul className="divide-y divide-feebay-500/20">
            {pending.map((p) => {
              const remainingMs = Math.max(0, p.resolveAt - Date.now());
              const totalMs = p.resolveAt - p.saleAt;
              const elapsedPct = Math.min(100, ((totalMs - remainingMs) / totalMs) * 100);
              return (
                <li key={p.id} className="flex items-center gap-3 py-2.5">
                  <CardArt
                    name={p.item.name}
                    rarity={p.item.rarity}
                    hue={p.item.hue}
                    cardId={p.item.cardId}
                    grade={p.item.grade}
                    gradingCompany={p.item.gradingCompany}
                    centeringOffsetX={p.item.centeringOffsetX}
                    centeringOffsetY={p.item.centeringOffsetY}
                    small
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold text-ink-900 truncate">{p.item.name}</div>
                    <div className="text-[11px] text-ink-500">
                      @{p.buyerName} on{' '}
                      <span className="text-ink-700 font-semibold">{p.marketplace}</span>
                      <span className="text-ink-300 mx-1.5">•</span>
                      <span className="italic text-feebay-700">waiting for payment…</span>
                    </div>
                    <div className="mt-1.5 h-1.5 w-full rounded-full bg-feebay-500/15 overflow-hidden">
                      <div
                        className="h-full bg-feebay-500"
                        style={{ width: `${elapsedPct}%` }}
                      />
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-sm font-black text-ink-900">
                      {money(p.netRevenue)}
                    </div>
                    <div className="text-[11px] text-ink-500">if paid</div>
                  </div>
                  <div className="text-[11px] text-ink-400 shrink-0 w-16 text-right">
                    {Math.ceil(remainingMs / 1000)}s
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {/* Sale history */}
      <div className="rounded-xl border border-line bg-white shadow-card p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-md bg-ebayGreen-500/15 text-ebayGreen-700 flex items-center justify-center">
              <Icon name="chart-up" size={18} />
            </div>
            <div>
              <div className="font-black text-ink-900">Recent sales</div>
              <div className="text-xs text-ink-500">Last {Math.min(30, history.length)} cards sold off your storefront</div>
            </div>
          </div>
          {history.length > 0 && (
            <div className="text-xs text-ink-500">
              Lifetime net:{' '}
              <span
                className={
                  history.reduce((s, h) => s + h.profit, 0) >= 0
                    ? 'text-ebayGreen-700 font-bold'
                    : 'text-ebayRed-600 font-bold'
                }
              >
                {history.reduce((s, h) => s + h.profit, 0) >= 0 ? '+' : ''}
                {money(history.reduce((s, h) => s + h.profit, 0))}
              </span>
            </div>
          )}
        </div>

        {history.length === 0 ? (
          <div className="text-sm text-ink-500 py-6 text-center border border-dashed border-line rounded-md">
            No sales yet. When something sells, it'll show up here.
          </div>
        ) : (
          <ul className="divide-y divide-lineSoft">
            {history.map((h) => {
              const cancelled = h.status === 'cancelled';
              return (
                <li
                  key={h.id}
                  className={`flex items-center gap-3 py-2.5 ${cancelled ? 'opacity-70' : ''}`}
                >
                  <CardArt
                    name={h.cardName}
                    rarity={h.rarity}
                    hue={h.hue}
                    cardId={h.cardId}
                    grade={h.grade}
                    gradingCompany={h.gradingCompany}
                    centeringOffsetX={h.centeringOffsetX}
                    centeringOffsetY={h.centeringOffsetY}
                    small
                  />
                  <div className="flex-1 min-w-0">
                    <div
                      className={`text-sm font-bold truncate ${
                        cancelled ? 'text-ink-600 line-through decoration-ebayRed-500/60' : 'text-ink-900'
                      }`}
                    >
                      {h.cardName}
                    </div>
                    <div className="text-[11px] text-ink-500">
                      {cancelled ? 'Listed on' : 'Sold on'}{' '}
                      <span className="text-ink-700 font-semibold">{h.marketplace}</span>
                      <span className="text-ink-300 mx-1.5">•</span>
                      {h.rarity}
                      {h.grade !== undefined && (
                        <>
                          <span className="text-ink-300 mx-1.5">•</span>
                          <span className="text-ebayYellow-700 font-semibold">
                            {h.gradingCompany} {h.grade}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    {cancelled ? (
                      <>
                        <div className="text-sm font-black text-ink-400">—</div>
                        <div className="text-[11px] font-bold text-ebayRed-500">No payment</div>
                      </>
                    ) : (
                      <>
                        <div className="text-sm font-black text-ink-900">
                          {money(h.netRevenue)}
                        </div>
                        <div
                          className={`text-[11px] font-bold ${
                            h.profit >= 0 ? 'text-ebayGreen-600' : 'text-ebayRed-500'
                          }`}
                        >
                          {h.profit >= 0 ? '+' : ''}{money(h.profit)}
                        </div>
                      </>
                    )}
                  </div>
                  <div className="shrink-0 w-20 flex justify-center">
                    {h.status === 'instant' ? (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-ebayGreen-500/15 text-ebayGreen-700 border border-ebayGreen-500/50">
                        <Icon name="check" size={10} /> Instant
                      </span>
                    ) : h.status === 'delayed' ? (
                      <span
                        className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-feebay-50 text-feebay-700 border border-feebay-500/50"
                        title="Buyer took a while to pay"
                      >
                        <Icon name="wallet" size={10} /> Delayed
                      </span>
                    ) : (
                      <span
                        className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-ebayRed-500/10 text-ebayRed-600 border border-ebayRed-500/50"
                        title="Buyer never paid — card returned to inventory"
                      >
                        <Icon name="x" size={10} /> Cancelled
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-ink-400 shrink-0 w-16 text-right">
                    {fmtRelative(h.soldAt)}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

function WalletStat({
  icon,
  label,
  value,
  sub,
  accent = 'text-ink-900',
}: {
  icon: 'wallet' | 'tag' | 'chart-up';
  label: string;
  value: string;
  sub?: string;
  accent?: string;
}) {
  return (
    <div className="px-4 py-4 flex items-start gap-3">
      <div className="w-9 h-9 rounded-md bg-paper border border-line text-ink-600 flex items-center justify-center shrink-0">
        <Icon name={icon} size={16} />
      </div>
      <div className="min-w-0">
        <div className="text-[10px] uppercase tracking-widest text-ink-500 font-bold">{label}</div>
        <div className={`text-xl font-black tabular-nums leading-tight ${accent}`}>{value}</div>
        {sub && <div className="text-[10px] text-ink-500 mt-0.5">{sub}</div>}
      </div>
    </div>
  );
}

function Toggle({
  checked,
  disabled,
  onChange,
}: {
  checked: boolean;
  disabled?: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => !disabled && onChange(!checked)}
      className={`relative inline-flex items-center h-5 w-9 rounded-full transition shrink-0 ${
        disabled
          ? 'bg-ink-200 cursor-not-allowed'
          : checked
          ? 'bg-ebayGreen-500'
          : 'bg-ink-300'
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition ${
          checked ? 'translate-x-4' : 'translate-x-0.5'
        }`}
      />
    </button>
  );
}
