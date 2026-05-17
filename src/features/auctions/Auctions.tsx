import { useEffect, useRef, useState } from 'react';
import { refreshCooldownMs, useGameStore } from '../../store/useGameStore';
import { getCardById } from '../../data/cards';
import { CardArt } from '../../components/CardArt';
import { CardZoomOverlay } from '../../components/CardZoomOverlay';
import { Icon } from '../../components/Icon';
import { minNextBid, rivalHeat, type RivalHeat } from '../../game/auctionEngine';
import type { AuctionBid, AuctionListing, AuctionRival } from '../../types';

function fmtTime(ms: number): string {
  const s = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(s / 60);
  return `${m}:${(s % 60).toString().padStart(2, '0')}`;
}

export function Auctions() {
  const auctions = useGameStore((s) => s.auctions);
  const refresh = useGameStore((s) => s.refreshAuctions);
  const upgrades = useGameStore((s) => s.upgradesPurchased);
  const lastRefresh = useGameStore((s) => s.lastAuctionRefresh);
  const canBid = upgrades.includes('auction_paddle');
  const cooldown = refreshCooldownMs({ upgradesPurchased: upgrades });

  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 333);
    return () => clearInterval(id);
  }, []);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected =
    auctions.find((a) => a.id === selectedId) ??
    auctions.find((a) => !a.resolved && now < a.endsAt) ??
    auctions[0] ??
    null;

  const liveOthers = (excludeId: string | undefined) =>
    auctions.filter((a) => !a.resolved && now < a.endsAt && a.id !== excludeId);

  const skipToNext = () => {
    const curId = selected?.id;
    const live = liveOthers(curId);
    if (live.length > 0) {
      setSelectedId(live[0].id);
      return;
    }
    const others = auctions.filter((a) => a.id !== curId);
    if (others.length > 0) setSelectedId(others[0].id);
  };
  const hasNext = selected ? liveOthers(selected.id).length > 0 : false;

  const cooldownRemaining = lastRefresh ? Math.max(0, lastRefresh + cooldown - now) : 0;
  const canRefresh = canBid && cooldownRemaining === 0;

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="goblin-bob shrink-0">
            <GoblinHead mood="idle" size={50} />
          </div>
          <div>
            <h1 className="text-2xl font-bold">BidGoblin</h1>
            <p className="text-ink-500 text-sm">
              Snappy timed auctions. Read the room, time your bids, don't feed the goblin.
            </p>
          </div>
        </div>
        <button
          onClick={refresh}
          disabled={!canRefresh}
          className={`flex items-center gap-2 rounded px-4 py-2 text-sm font-semibold ${
            canRefresh
              ? 'bg-feebay-500 hover:bg-feebay-600 text-white'
              : 'bg-ink-100 text-ink-400 cursor-not-allowed'
          }`}
        >
          <Icon name="gavel" size={16} />
          {!canBid
            ? 'Locked'
            : canRefresh
            ? 'Call fresh lots'
            : `${Math.ceil(cooldownRemaining / 1000)}s`}
        </button>
      </div>

      {!canBid && (
        <div className="rounded border border-ebayYellow-700/50 bg-ebayYellow-500/10 text-ebayYellow-700 text-xs p-3">
          Locked. Buy the <span className="font-semibold">BidGoblin Paddle</span> upgrade to step onto
          the auction floor.
        </div>
      )}

      {canBid && auctions.length === 0 && (
        <div className="rounded-lg border border-dashed border-line p-10 text-center text-ink-500">
          The pit is empty. Hit <span className="font-semibold text-ink-700">Call fresh lots</span> and
          the goblin will drag some out.
        </div>
      )}

      {canBid && auctions.length > 0 && (
        <div className="grid lg:grid-cols-[270px_1fr] gap-4 items-start">
          <LotList
            auctions={auctions}
            now={now}
            selectedId={selected?.id ?? null}
            onSelect={setSelectedId}
          />
          {selected && (
            <BiddingPit
              key={selected.id}
              auction={selected}
              now={now}
              hasNext={hasNext}
              onSkip={skipToNext}
              canSnipe={upgrades.includes('auto_sniper')}
              showFakeRisk={upgrades.includes('fake_detector')}
            />
          )}
        </div>
      )}
    </div>
  );
}

/* ---------------- Lot list ---------------- */

function LotList({
  auctions,
  now,
  selectedId,
  onSelect,
}: {
  auctions: AuctionListing[];
  now: number;
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const live = auctions.filter((a) => !a.resolved && now < a.endsAt);
  const done = auctions.filter((a) => a.resolved || now >= a.endsAt);
  return (
    <div className="rounded-lg border border-line bg-white overflow-hidden">
      <div className="px-3 py-2 bg-feebay-600 text-white text-[11px] uppercase tracking-widest font-bold flex items-center gap-2">
        <Icon name="gavel" size={13} />
        Live lots
        <span className="ml-auto text-white/70">{live.length}</span>
      </div>
      <div className="max-h-[600px] overflow-y-auto">
        {live.map((a) => (
          <LotRow
            key={a.id}
            auction={a}
            now={now}
            selected={a.id === selectedId}
            onSelect={() => onSelect(a.id)}
          />
        ))}
        {done.length > 0 && (
          <div className="px-3 py-1.5 bg-ink-100 text-[10px] uppercase tracking-widest text-ink-500 font-bold">
            Closed
          </div>
        )}
        {done.map((a) => (
          <LotRow
            key={a.id}
            auction={a}
            now={now}
            selected={a.id === selectedId}
            onSelect={() => onSelect(a.id)}
          />
        ))}
      </div>
    </div>
  );
}

function LotRow({
  auction,
  now,
  selected,
  onSelect,
}: {
  auction: AuctionListing;
  now: number;
  selected: boolean;
  onSelect: () => void;
}) {
  const card = getCardById(auction.cardId);
  const remaining = auction.endsAt - now;
  const ended = auction.resolved || remaining <= 0;
  const closing = !ended && remaining < 12_000;
  const leading = auction.leaderName === 'You';
  return (
    <button
      onClick={onSelect}
      className={`w-full flex items-center gap-2.5 px-2.5 py-2 border-b border-lineSoft text-left transition ${
        selected ? 'bg-feebay-50 ring-1 ring-inset ring-feebay-500/40' : 'hover:bg-ink-50'
      } ${ended ? 'opacity-60' : ''}`}
    >
      <div className="h-[52px] w-[35px] shrink-0 overflow-hidden rounded-sm">
        <div className="origin-top-left" style={{ transform: 'scale(0.5469)' }}>
          <CardArt
            name={card.name}
            rarity={auction.rarity}
            hue={card.hue}
            cardId={auction.cardId}
            centeringOffsetX={auction.centeringOffsetX}
            centeringOffsetY={auction.centeringOffsetY}
            small
            animated={false}
          />
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-xs font-bold truncate">{card.name}</div>
        <div className="text-[10px] text-ink-500 truncate">{auction.rarity}</div>
        <div className="text-[11px] font-mono font-bold text-ink-800 mt-0.5">
          ${auction.currentBid}
        </div>
      </div>
      <div className="shrink-0 text-right">
        <div
          className={`text-[11px] font-mono font-bold ${
            closing ? 'text-ebayRed-500' : ended ? 'text-ink-400' : 'text-ink-700'
          }`}
        >
          {ended ? 'closed' : fmtTime(remaining)}
        </div>
        <div
          className={`text-[9px] uppercase tracking-wider font-bold mt-0.5 ${
            ended
              ? auction.wonByPlayer
                ? 'text-ebayGreen-600'
                : 'text-ink-400'
              : leading
              ? 'text-ebayGreen-600'
              : auction.bids.some((b) => b.kind === 'player')
              ? 'text-ebayRed-500'
              : 'text-ink-400'
          }`}
        >
          {ended
            ? auction.wonByPlayer
              ? 'won'
              : 'lost'
            : leading
            ? 'leading'
            : auction.bids.some((b) => b.kind === 'player')
            ? 'outbid'
            : 'open'}
        </div>
      </div>
    </button>
  );
}

/* ---------------- Bidding pit ---------------- */

function BiddingPit({
  auction,
  now,
  hasNext,
  onSkip,
  canSnipe,
  showFakeRisk,
}: {
  auction: AuctionListing;
  now: number;
  hasNext: boolean;
  onSkip: () => void;
  canSnipe: boolean;
  showFakeRisk: boolean;
}) {
  const card = getCardById(auction.cardId);
  const cash = useGameStore((s) => s.cash);
  const placeBid = useGameStore((s) => s.placeBid);
  const buyout = useGameStore((s) => s.buyoutAuction);
  const setMax = useGameStore((s) => s.setAutoSnipeMax);

  const remaining = auction.endsAt - now;
  const ended = auction.resolved || remaining <= 0;
  const closing = !ended && remaining < 12_000;
  const minNext = minNextBid(auction);
  const leading = auction.leaderName === 'You';
  const playerIn = auction.bids.some((b) => b.kind === 'player');
  const bidCount = auction.bids.filter((b) => b.kind === 'player' || b.kind === 'rival').length;
  const activeBidders =
    auction.rivals.filter((r) => r.active).length + (playerIn && !leading ? 1 : 0);

  const [jumpInput, setJumpInput] = useState('');
  const [maxInput, setMaxInput] = useState(auction.myMaxBid ? String(auction.myMaxBid) : '');
  const [zoomed, setZoomed] = useState(false);

  // Auto-advance to the next live lot a few seconds after this one closes.
  const onSkipRef = useRef(onSkip);
  onSkipRef.current = onSkip;
  const [autoSkipAt, setAutoSkipAt] = useState<number | null>(null);
  useEffect(() => {
    if (ended && hasNext && autoSkipAt === null) setAutoSkipAt(Date.now() + 5000);
  }, [ended, hasNext, autoSkipAt]);
  useEffect(() => {
    if (autoSkipAt === null) return;
    const t = setTimeout(() => onSkipRef.current(), Math.max(0, autoSkipAt - Date.now()));
    return () => clearTimeout(t);
  }, [autoSkipAt]);
  const skipIn = autoSkipAt !== null ? Math.max(0, Math.ceil((autoSkipAt - now) / 1000)) : null;

  const jumpVal = Number(jumpInput);
  const jumpValid = Number.isFinite(jumpVal) && jumpVal > minNext && jumpVal <= cash;
  const valueGap = auction.trueMarketValue - auction.currentBid;

  const goblinMood: 'idle' | 'greedy' | 'cackle' = ended
    ? auction.wonByPlayer
      ? 'idle'
      : 'cackle'
    : closing
    ? 'cackle'
    : leading
    ? 'greedy'
    : 'idle';

  const goblinLine = ended
    ? auction.wonByPlayer
      ? 'BAH. Fine. It is yours. Now PAY UP.'
      : 'HEHEHE! The pit keeps another one.'
    : closing
    ? 'Going... GOING... paddles UP, you cowards!'
    : leading
    ? 'You lead? For now. The goblin licks his teeth.'
    : playerIn
    ? 'Outbid! HEH. Want it back? Pay the toll.'
    : auction.leaderName
    ? 'Fresh meat. Step up to the pit, paddle ready.'
    : 'No bids?! Open it, open it — do not be shy.';

  return (
    <div
      className={`rounded-lg overflow-hidden border-2 bg-white shadow-card ${
        ended
          ? auction.wonByPlayer
            ? 'border-ebayGreen-500'
            : 'border-ink-300'
          : closing
          ? 'border-ebayRed-500'
          : 'border-line'
      }`}
    >
      {/* Top strip */}
      <div className="flex items-center justify-between px-4 pt-2.5 pb-1">
        <span className="text-[10px] uppercase tracking-[0.2em] text-feebay-700 font-bold">
          BidGoblin Auction Pit
        </span>
        {hasNext && (
          <button
            onClick={onSkip}
            className="text-[11px] font-semibold text-ink-500 hover:text-feebay-600"
          >
            Skip lot →
          </button>
        )}
      </div>

      {/* The pit — light, eBay-style */}
      <div
        className={`relative px-4 pb-4 ${closing ? 'pit-closing' : ''} ${
          closing
            ? 'bg-gradient-to-b from-ebayRed-500/10 to-white'
            : 'bg-gradient-to-b from-feebay-50 to-white'
        }`}
      >
        <div className="flex gap-4">
          <div className="relative shrink-0">
            <CardArt
              name={card.name}
              rarity={auction.rarity}
              hue={card.hue}
              cardId={auction.cardId}
              centeringOffsetX={auction.centeringOffsetX}
              centeringOffsetY={auction.centeringOffsetY}
            />
            <button
              onClick={() => setZoomed(true)}
              className="absolute -top-2.5 -right-2.5 z-20 w-8 h-8 rounded-full bg-feebay-500 hover:bg-feebay-600 text-white flex items-center justify-center shadow-md border-2 border-white transition"
              title="Zoom in to inspect condition & centering"
            >
              <Icon name="search" size={15} />
            </button>
            {zoomed && (
              <CardZoomOverlay
                name={card.name}
                rarity={auction.rarity}
                hue={card.hue}
                cardId={auction.cardId}
                centeringOffsetX={auction.centeringOffsetX}
                centeringOffsetY={auction.centeringOffsetY}
                condition={auction.rawCondition}
                onClose={() => setZoomed(false)}
              />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-base font-black truncate leading-tight text-ink-900">
              {card.name}
            </div>
            <div className="text-xs text-ink-500">
              {auction.rarity} • {auction.rawCondition}
            </div>
            <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-ink-600">
              <span>
                Est. value{' '}
                <b className="text-ebayGreen-700">${auction.trueMarketValue}</b>
              </span>
              <span className="flex items-center gap-1">
                <Icon name="eye" size={11} /> {auction.watchers} watching
              </span>
              <span className="flex items-center gap-1">
                <Icon name="gavel" size={11} /> {activeBidders} bidder
                {activeBidders === 1 ? '' : 's'} in
              </span>
              {showFakeRisk && (
                <span>
                  Auth scan:{' '}
                  {auction.isFake ? (
                    <b className="text-ebayRed-500">SUSPECT</b>
                  ) : (
                    <b className="text-ebayGreen-700">clean</b>
                  )}
                </span>
              )}
            </div>
          </div>
          <div className="shrink-0 hidden sm:flex flex-col items-center w-[150px]">
            <SpeechBubble text={goblinLine} />
            <div className={goblinMood === 'cackle' ? 'goblin-cackle' : 'goblin-bob'}>
              <GoblinHead mood={goblinMood} size={76} />
            </div>
          </div>
        </div>

        {/* High bid + clock */}
        <div className="mt-3 flex items-stretch gap-3">
          <div className="flex-1 rounded-md bg-white border border-line px-3 py-2">
            <div className="text-[10px] uppercase tracking-widest text-ink-500">
              Current high bid · {bidCount} bid{bidCount === 1 ? '' : 's'}
            </div>
            <div
              className={`text-3xl font-black leading-none ${
                leading && !ended ? 'text-ebayGreen-700' : 'text-ink-900'
              }`}
            >
              ${auction.currentBid}
            </div>
            <div
              className={`text-xs mt-1 font-bold ${
                ended
                  ? auction.wonByPlayer
                    ? 'text-ebayGreen-600'
                    : 'text-ink-400'
                  : leading
                  ? 'text-ebayGreen-600'
                  : 'text-ebayRed-500'
              }`}
            >
              {ended
                ? auction.wonByPlayer
                  ? '★ YOU WON THIS LOT'
                  : 'CLOSED'
                : leading
                ? '★ You hold the high bid'
                : auction.leaderName
                ? `held by ${auction.leaderName}`
                : 'no bids yet'}
            </div>
          </div>
          <div
            className={`w-32 rounded-md border px-3 py-2 flex flex-col justify-center items-center ${
              closing
                ? 'border-ebayRed-500 bg-ebayRed-500/10'
                : 'border-line bg-white'
            }`}
          >
            <div className="text-[10px] uppercase tracking-widest text-ink-500">
              {ended ? 'Ended' : 'Closes in'}
            </div>
            <div
              className={`text-2xl font-black font-mono ${
                closing ? 'text-ebayRed-600 animate-pulse' : 'text-ink-900'
              }`}
            >
              {ended ? '—' : fmtTime(remaining)}
            </div>
            {auction.extensionCount > 0 && (
              <div className="text-[9px] uppercase tracking-widest text-ebayYellow-700 font-bold">
                ⚡ extended ×{auction.extensionCount}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Floor — rivals, feed, controls */}
      <div className="border-t border-line p-3 space-y-3">
        <div>
          <div className="text-[10px] uppercase tracking-widest text-ink-500 font-bold mb-1.5">
            In the pit
          </div>
          <div className="flex flex-wrap gap-1.5">
            {auction.rivals.map((r) => (
              <RivalChip key={r.id} rival={r} heat={rivalHeat(r, auction)} />
            ))}
          </div>
        </div>

        <BidFeed bids={auction.bids} />

        {!ended ? (
          <div className="space-y-2">
            {leading ? (
              <div className="rounded-md bg-ebayGreen-500/10 border border-ebayGreen-500/40 text-ebayGreen-700 text-xs font-semibold px-3 py-2 text-center">
                You hold the high bid. Sit tight — or arm a proxy max and let the goblin sweat.
              </div>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={() => placeBid(auction.id)}
                  disabled={cash < minNext}
                  className={`flex-1 rounded-md py-2 text-sm font-bold ${
                    cash >= minNext
                      ? 'bg-feebay-500 hover:bg-feebay-600 text-white'
                      : 'bg-ink-100 text-ink-400 cursor-not-allowed'
                  }`}
                >
                  Place bid · ${minNext}
                </button>
                {auction.buyoutPrice && (
                  <button
                    onClick={() => buyout(auction.id)}
                    disabled={cash < auction.buyoutPrice}
                    className={`rounded-md py-2 px-3 text-sm font-bold ${
                      cash >= auction.buyoutPrice
                        ? 'bg-ebayYellow-500 hover:bg-ebayYellow-600 text-ink-900'
                        : 'bg-ink-100 text-ink-400 cursor-not-allowed'
                    }`}
                  >
                    Buyout ${auction.buyoutPrice}
                  </button>
                )}
              </div>
            )}

            {!leading && (
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-ink-500 shrink-0">Jump bid</span>
                <input
                  type="number"
                  value={jumpInput}
                  placeholder={`> ${minNext}`}
                  onChange={(e) => setJumpInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && jumpValid) {
                      placeBid(auction.id, jumpVal);
                      setJumpInput('');
                    }
                  }}
                  className="w-24 bg-ink-100 border border-line rounded px-2 py-1 text-xs"
                />
                <button
                  onClick={() => {
                    if (jumpValid) {
                      placeBid(auction.id, jumpVal);
                      setJumpInput('');
                    }
                  }}
                  disabled={!jumpValid}
                  className={`rounded px-3 py-1 text-xs font-bold ${
                    jumpValid
                      ? 'bg-ink-900 hover:bg-ink-800 text-white'
                      : 'bg-ink-100 text-ink-400 cursor-not-allowed'
                  }`}
                >
                  Jump
                </button>
                <span className="text-[10px] text-ink-400 leading-tight hidden md:block">
                  a big raise can scare a sweating bidder out
                </span>
              </div>
            )}

            {canSnipe ? (
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-ink-500 shrink-0">Proxy max</span>
                <input
                  type="number"
                  value={maxInput}
                  placeholder="auto-bid ceiling"
                  onChange={(e) => setMaxInput(e.target.value)}
                  onBlur={() => setMax(auction.id, maxInput ? Number(maxInput) : undefined)}
                  className="w-32 bg-ink-100 border border-line rounded px-2 py-1 text-xs"
                />
                {auction.myMaxBid ? (
                  <span className="text-ebayGreen-600 text-[11px] font-semibold">
                    armed @ ${auction.myMaxBid}
                  </span>
                ) : (
                  <span className="text-[10px] text-ink-400">defends your lead automatically</span>
                )}
              </div>
            ) : (
              <div className="text-[10px] text-ink-400">
                Tip: the <span className="font-semibold">Auto-Sniper</span> upgrade unlocks a proxy
                max that auto-defends your lead.
              </div>
            )}

            <div className="text-[10px] text-ink-500 border-t border-lineSoft pt-1.5">
              Win at ${auction.currentBid} and you'd be{' '}
              <span
                className={
                  valueGap >= 0
                    ? 'text-ebayGreen-600 font-semibold'
                    : 'text-ebayRed-500 font-semibold'
                }
              >
                {valueGap >= 0 ? `~$${valueGap} under` : `~$${Math.abs(valueGap)} over`}
              </span>{' '}
              est. value. Bid wars feed the goblin, not you.
            </div>
          </div>
        ) : (
          <div
            className={`rounded-md px-3 py-3 text-center text-sm font-bold ${
              auction.wonByPlayer
                ? 'bg-ebayGreen-500/10 text-ebayGreen-700 border border-ebayGreen-500/40'
                : 'bg-ink-100 text-ink-500 border border-line'
            }`}
          >
            <div>
              {auction.wonByPlayer
                ? `Won for $${auction.currentBid}. Hauled into your inventory.`
                : `Lot closed at $${auction.currentBid}${
                    auction.leaderName && auction.leaderName !== 'You'
                      ? ` — ${auction.leaderName} took it.`
                      : '.'
                  }`}
            </div>
            {skipIn !== null && (
              <div className="mt-1 text-[11px] font-semibold text-ink-500">
                Next lot in {skipIn}s ·{' '}
                <button onClick={onSkip} className="text-feebay-600 hover:text-feebay-700 underline">
                  skip now
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------------- Rivals ---------------- */

const HEAT_CONFIG: Record<RivalHeat, { label: string; cls: string }> = {
  leading: { label: 'high bid', cls: 'bg-ebayRed-500 text-white border-ebayRed-600' },
  sweating: {
    label: 'sweating',
    cls: 'bg-ebayYellow-500/20 text-ebayYellow-700 border-ebayYellow-500/50',
  },
  circling: { label: 'circling', cls: 'bg-ink-100 text-ink-700 border-line' },
  out: { label: 'tapped out', cls: 'bg-ink-100 text-ink-300 border-line line-through' },
};

function RivalChip({ rival, heat }: { rival: AuctionRival; heat: RivalHeat }) {
  const cfg = HEAT_CONFIG[heat];
  return (
    <div
      className={`flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${cfg.cls}`}
      title={`${rival.name} — ${cfg.label}`}
    >
      <span>{rival.name}</span>
      <span className="opacity-70">· {cfg.label}</span>
    </div>
  );
}

/* ---------------- Bid feed ---------------- */

function BidFeed({ bids }: { bids: AuctionBid[] }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-widest text-ink-500 font-bold mb-1.5">
        Bid feed
      </div>
      <div className="h-44 rounded-md border border-line bg-paper overflow-y-auto">
        {bids.length === 0 ? (
          <div className="px-3 py-5 text-center text-ink-400 text-xs">
            No bids yet. Be the first — or wait for the goblins to circle.
          </div>
        ) : (
          bids.map((b) => <FeedRow key={b.id} bid={b} />)
        )}
      </div>
    </div>
  );
}

function FeedRow({ bid }: { bid: AuctionBid }) {
  if (bid.kind === 'goblin') {
    return (
      <div className="bid-row-enter px-3 py-1 text-[11px] italic text-ink-400 border-b border-lineSoft">
        {bid.text}
      </div>
    );
  }
  if (bid.kind === 'system') {
    return (
      <div className="bid-row-enter px-3 py-1 text-[11px] font-bold text-ebayYellow-700 bg-ebayYellow-500/10 border-b border-lineSoft flex items-center gap-1">
        <Icon name="bolt" size={11} />
        {bid.text}
      </div>
    );
  }
  const isYou = bid.kind === 'player';
  return (
    <div
      className={`bid-row-enter px-3 py-1 text-xs border-b border-lineSoft flex items-center gap-2 ${
        isYou ? 'bg-ebayGreen-500/10' : 'bg-white'
      }`}
    >
      <Icon
        name="gavel"
        size={11}
        className={isYou ? 'text-ebayGreen-600' : 'text-ebayYellow-600'}
      />
      <span className={`font-bold ${isYou ? 'text-ebayGreen-700' : 'text-ink-800'}`}>
        {isYou ? 'You' : bid.bidder}
      </span>
      <span className="text-ink-400">bid</span>
      <span className="ml-auto font-mono font-bold text-ink-900">${bid.amount}</span>
    </div>
  );
}

/* ---------------- Goblin ---------------- */

function SpeechBubble({ text }: { text: string }) {
  return (
    <div className="relative mb-1 rounded-lg bg-ink-900 text-white text-[10px] font-semibold leading-snug px-2 py-1 shadow-md text-center">
      {text}
      <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-ink-900 rotate-45" />
    </div>
  );
}

function GoblinHead({
  mood = 'idle',
  size = 72,
}: {
  mood?: 'idle' | 'greedy' | 'cackle';
  size?: number;
}) {
  const open = mood === 'cackle';
  const eyeRy = mood === 'greedy' ? 3.6 : 5.2;
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      {/* hood */}
      <path d="M16 56 Q10 12 50 8 Q90 12 84 56 Q84 30 50 28 Q16 30 16 56 Z" fill="#241830" />
      {/* ears */}
      <path
        d="M24 46 L3 28 L26 58 Z"
        fill="#5a9e4a"
        stroke="#3c7233"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M76 46 L97 28 L74 58 Z"
        fill="#5a9e4a"
        stroke="#3c7233"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      {/* face */}
      <path
        d="M27 44 Q26 82 50 90 Q74 82 73 44 Q73 26 50 26 Q27 26 27 44 Z"
        fill="#62b04f"
        stroke="#3c7233"
        strokeWidth="2.5"
      />
      {/* brows */}
      <path d="M31 47 Q39 41 47 47" stroke="#2f5a28" strokeWidth="3.5" strokeLinecap="round" fill="none" />
      <path d="M53 47 Q61 41 69 47" stroke="#2f5a28" strokeWidth="3.5" strokeLinecap="round" fill="none" />
      {/* eyes */}
      <ellipse className="goblin-eye" cx="40" cy="54" rx="6.5" ry={eyeRy} fill="#fde047" />
      <ellipse className="goblin-eye" cx="60" cy="54" rx="6.5" ry={eyeRy} fill="#fde047" />
      <circle cx="41" cy="54" r="2.2" fill="#1a1205" />
      <circle cx="61" cy="54" r="2.2" fill="#1a1205" />
      {/* nose */}
      <path
        d="M50 56 Q57 65 50 72 Q45 70 46 63 Z"
        fill="#4e9440"
        stroke="#3c7233"
        strokeWidth="1.5"
      />
      {/* mouth */}
      {open ? (
        <>
          <path d="M36 74 Q50 92 64 74 Q50 80 36 74 Z" fill="#1c1208" />
          <path d="M40 75 l3 6 3 -6 Z" fill="#ffffff" />
          <path d="M54 75 l3 6 3 -6 Z" fill="#ffffff" />
        </>
      ) : (
        <>
          <path
            d="M37 75 Q50 83 63 75"
            stroke="#1c1208"
            strokeWidth="3"
            strokeLinecap="round"
            fill="none"
          />
          <path d="M43 76 l2.5 5 2.5 -5 Z" fill="#ffffff" />
          <path d="M52 76 l2.5 5 2.5 -5 Z" fill="#ffffff" />
        </>
      )}
    </svg>
  );
}
