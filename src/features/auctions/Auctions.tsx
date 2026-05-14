import { useEffect, useState } from 'react';
import { refreshCooldownMs, useGameStore } from '../../store/useGameStore';
import { getCardById } from '../../data/cards';
import { CardArt } from '../../components/CardArt';
import { Icon } from '../../components/Icon';
import type { AuctionListing } from '../../types';

export function Auctions() {
  const auctions = useGameStore((s) => s.auctions);
  const refresh = useGameStore((s) => s.refreshAuctions);
  const placeBid = useGameStore((s) => s.placeBid);
  const buyout = useGameStore((s) => s.buyoutAuction);
  const setMax = useGameStore((s) => s.setAutoSnipeMax);
  const upgrades = useGameStore((s) => s.upgradesPurchased);
  const cash = useGameStore((s) => s.cash);
  const lastRefresh = useGameStore((s) => s.lastAuctionRefresh);
  const showFakeRisk = upgrades.includes('fake_detector');
  const canBid = upgrades.includes('auction_paddle');
  const canSnipe = upgrades.includes('auto_sniper');
  const cooldown = refreshCooldownMs({ upgradesPurchased: upgrades });

  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(id);
  }, []);
  const cooldownRemaining = lastRefresh ? Math.max(0, lastRefresh + cooldown - now) : 0;
  const canRefresh = canBid && cooldownRemaining === 0;

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">BidGoblin</h1>
          <p className="text-slate-400 text-sm">
            Timed auctions. Bid wars. Snipe at the last second. The goblin watches.
          </p>
        </div>
        <button
          onClick={refresh}
          className={`flex items-center gap-2 rounded px-4 py-2 text-sm font-semibold ${
            canRefresh
              ? 'bg-feebay-600 hover:bg-feebay-500 text-white'
              : 'bg-slate-800 text-slate-500 cursor-not-allowed'
          }`}
          disabled={!canRefresh}
        >
          <Icon name="gavel" size={16} />
          {!canBid
            ? 'Locked'
            : canRefresh
            ? 'New auction batch'
            : `${Math.ceil(cooldownRemaining / 1000)}s`}
        </button>
      </div>

      {!canBid && (
        <div className="rounded border border-amber-700/40 bg-amber-900/20 text-amber-200 text-xs p-3">
          Locked. Buy the <span className="font-semibold">BidGoblin Paddle</span> upgrade to access auctions.
        </div>
      )}

      {auctions.length === 0 ? (
        <div className="rounded border border-dashed border-slate-700 p-10 text-center text-slate-400">
          {canBid ? 'No auctions live. Click the button above.' : ''}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {auctions.map((a) => (
            <AuctionCard
              key={a.id}
              auction={a}
              cash={cash}
              canSnipe={canSnipe}
              showFakeRisk={showFakeRisk}
              onBid={() => placeBid(a.id)}
              onBuyout={() => buyout(a.id)}
              onSetMax={(v) => setMax(a.id, v)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function AuctionCard({
  auction,
  cash,
  canSnipe,
  showFakeRisk,
  onBid,
  onBuyout,
  onSetMax,
}: {
  auction: AuctionListing;
  cash: number;
  canSnipe: boolean;
  showFakeRisk: boolean;
  onBid: () => void;
  onBuyout: () => void;
  onSetMax: (v: number | undefined) => void;
}) {
  const card = getCardById(auction.cardId);
  const remaining = Math.max(0, auction.endsAt - Date.now());
  const remainingS = Math.ceil(remaining / 1000);
  const nextBid = auction.currentBid + auction.bidIncrement;
  const closing = remaining < 10_000 && !auction.resolved;
  const [maxInput, setMaxInput] = useState<string>(auction.myMaxBid ? String(auction.myMaxBid) : '');

  return (
    <div
      className={`rounded-lg border p-3 flex flex-col gap-3 ${
        auction.resolved
          ? auction.wonByPlayer
            ? 'border-emerald-700/50 bg-emerald-900/20'
            : 'border-slate-800 bg-slate-900/40 opacity-70'
          : closing
          ? 'border-rose-500/60 bg-slate-900/60 animate-pulse'
          : 'border-slate-800 bg-slate-900/60'
      }`}
    >
      <div className="flex items-start gap-3">
        <CardArt
          name={card.name}
          rarity={auction.rarity}
          hue={card.hue}
          cardId={auction.cardId}
          centeringOffsetX={auction.centeringOffsetX}
          centeringOffsetY={auction.centeringOffsetY}
          small
        />
        <div className="flex-1 min-w-0">
          <div className="text-[10px] uppercase tracking-widest text-purple-300">BidGoblin</div>
          <div className="font-semibold text-sm truncate">{card.name}</div>
          <div className="text-xs text-slate-400">{auction.rarity} • {auction.rawCondition}</div>
          {showFakeRisk && (
            <div className="text-[10px] text-slate-500 mt-1">
              Auth scan: {auction.isFake ? <span className="text-rose-300">SUSPECT</span> : <span className="text-emerald-300">clean</span>}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs">
        <Pill label="Current bid" value={`$${auction.currentBid}`} accent={auction.isMine ? 'text-emerald-300' : 'text-slate-200'} />
        <Pill label="Est. value" value={`$${auction.trueMarketValue}`} accent="text-feebay-300" />
        <Pill
          label="Ends in"
          value={auction.resolved ? '—' : `${remainingS}s`}
          accent={closing ? 'text-rose-300' : 'text-slate-200'}
        />
        <Pill
          label="Status"
          value={
            auction.resolved
              ? auction.wonByPlayer
                ? 'WON'
                : 'LOST'
              : auction.isMine
              ? 'Leading'
              : 'Outbid'
          }
          accent={
            auction.resolved
              ? auction.wonByPlayer
                ? 'text-emerald-300'
                : 'text-slate-400'
              : auction.isMine
              ? 'text-emerald-300'
              : 'text-amber-300'
          }
        />
      </div>

      {!auction.resolved && (
        <>
          <div className="flex gap-2">
            <button
              onClick={onBid}
              disabled={cash < nextBid}
              className={`flex-1 rounded py-1.5 text-xs font-semibold ${
                cash >= nextBid
                  ? 'bg-feebay-600 hover:bg-feebay-500'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed'
              }`}
            >
              Bid ${nextBid}
            </button>
            {auction.buyoutPrice && (
              <button
                onClick={onBuyout}
                disabled={cash < auction.buyoutPrice}
                className={`flex-1 rounded py-1.5 text-xs font-semibold ${
                  cash >= auction.buyoutPrice
                    ? 'bg-amber-600 hover:bg-amber-500'
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                }`}
              >
                Buyout ${auction.buyoutPrice}
              </button>
            )}
          </div>
          {canSnipe && (
            <div className="flex gap-2 items-center text-xs">
              <span className="text-slate-400">Auto-snipe max:</span>
              <input
                type="number"
                value={maxInput}
                placeholder="0"
                onChange={(e) => setMaxInput(e.target.value)}
                onBlur={() => onSetMax(maxInput ? Number(maxInput) : undefined)}
                className="w-20 bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs"
              />
              {auction.myMaxBid && (
                <span className="text-emerald-300">armed @ ${auction.myMaxBid}</span>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function Pill({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <div className="rounded bg-slate-800/70 px-2 py-1">
      <div className="text-[9px] uppercase tracking-widest text-slate-500">{label}</div>
      <div className={`text-xs font-semibold ${accent}`}>{value}</div>
    </div>
  );
}
