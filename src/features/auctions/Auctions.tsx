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
          <p className="text-ink-500 text-sm">
            Timed auctions. Bid wars. Snipe at the last second. The goblin watches.
          </p>
        </div>
        <button
          onClick={refresh}
          className={`flex items-center gap-2 rounded px-4 py-2 text-sm font-semibold ${
            canRefresh
              ? 'bg-feebay-500 hover:bg-feebay-600 text-white'
              : 'bg-ink-100 text-ink-400 cursor-not-allowed'
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
        <div className="rounded border border-ebayYellow-700/50 bg-ebayYellow-500/10 text-ebayYellow-700 text-xs p-3">
          Locked. Buy the <span className="font-semibold">BidGoblin Paddle</span> upgrade to access auctions.
        </div>
      )}

      {auctions.length === 0 ? (
        <div className="rounded border border-dashed border-line p-10 text-center text-ink-500">
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
            ? 'border-ebayGreen-500/60 bg-ebayGreen-500/10'
            : 'border-line bg-white shadow-card opacity-70'
          : closing
          ? 'border-ebayRed-500 bg-white shadow-card animate-pulse'
          : 'border-line bg-white shadow-card'
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
          <div className="text-[10px] uppercase tracking-widest text-feebay-600">BidGoblin</div>
          <div className="font-semibold text-sm truncate">{card.name}</div>
          <div className="text-xs text-ink-500">{auction.rarity} • {auction.rawCondition}</div>
          {showFakeRisk && (
            <div className="text-[10px] text-ink-400 mt-1">
              Auth scan: {auction.isFake ? <span className="text-ebayRed-500">SUSPECT</span> : <span className="text-ebayGreen-600">clean</span>}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs">
        <Pill label="Current bid" value={`$${auction.currentBid}`} accent={auction.isMine ? 'text-ebayGreen-600' : 'text-ink-800'} />
        <Pill label="Est. value" value={`$${auction.trueMarketValue}`} accent="text-feebay-600" />
        <Pill
          label="Ends in"
          value={auction.resolved ? '—' : `${remainingS}s`}
          accent={closing ? 'text-ebayRed-500' : 'text-ink-800'}
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
                ? 'text-ebayGreen-600'
                : 'text-ink-500'
              : auction.isMine
              ? 'text-ebayGreen-600'
              : 'text-ebayYellow-700'
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
                  ? 'bg-feebay-500 hover:bg-feebay-600'
                  : 'bg-ink-100 text-ink-400 cursor-not-allowed'
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
                    ? 'bg-ebayYellow-500 hover:bg-ebayYellow-600 text-ink-900'
                    : 'bg-ink-100 text-ink-400 cursor-not-allowed'
                }`}
              >
                Buyout ${auction.buyoutPrice}
              </button>
            )}
          </div>
          {canSnipe && (
            <div className="flex gap-2 items-center text-xs">
              <span className="text-ink-500">Auto-snipe max:</span>
              <input
                type="number"
                value={maxInput}
                placeholder="0"
                onChange={(e) => setMaxInput(e.target.value)}
                onBlur={() => onSetMax(maxInput ? Number(maxInput) : undefined)}
                className="w-20 bg-ink-100 border border-line rounded px-2 py-1 text-xs"
              />
              {auction.myMaxBid && (
                <span className="text-ebayGreen-600">armed @ ${auction.myMaxBid}</span>
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
    <div className="rounded bg-ink-100 px-2 py-1">
      <div className="text-[9px] uppercase tracking-widest text-ink-400">{label}</div>
      <div className={`text-xs font-semibold ${accent}`}>{value}</div>
    </div>
  );
}
