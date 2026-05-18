import { useState } from 'react';
import { useGameStore, vaultStableFor } from '../../store/useGameStore';
import { getShopTier, SHOP_TIERS } from '../../data/shop';
import { BRAND_COLORS, BRAND_LOGOS, DEFAULT_SHOP_NAME } from '../../data/branding';
import { calculateCurrentValue } from '../../game/economyEngine';
import { CardArt } from '../../components/CardArt';
import { Icon, type IconName } from '../../components/Icon';
import { money } from '../../game/format';
import type { InventoryItem } from '../../types';

export function Shop() {
  const shopTier = useGameStore((s) => s.shopTier);
  const displayedItemIds = useGameStore((s) => s.displayedItemIds);
  const showcaseItemIds = useGameStore((s) => s.showcaseItemIds);
  const inventory = useGameStore((s) => s.inventory);
  const cash = useGameStore((s) => s.cash);
  const shopRevenue = useGameStore((s) => s.shopRevenue);
  const shopLog = useGameStore((s) => s.shopLog);
  const trends = useGameStore((s) => s.marketTrends);
  const noise = useGameStore((s) => s.marketNoise);
  const convention = useGameStore((s) => s.convention);
  const upgradesPurchased = useGameStore((s) => s.upgradesPurchased);
  const shopName = useGameStore((s) => s.shopName);
  const shopLogo = useGameStore((s) => s.shopLogo);
  const shopColor = useGameStore((s) => s.shopColor);
  const upgradeShop = useGameStore((s) => s.upgradeShop);
  const displayItem = useGameStore((s) => s.displayItem);
  const undisplayItem = useGameStore((s) => s.undisplayItem);
  const updateBranding = useGameStore((s) => s.updateBranding);

  const [nameDraft, setNameDraft] = useState(shopName);

  const tier = getShopTier(shopTier);
  const next = SHOP_TIERS[shopTier + 1] ?? null;
  const stable = vaultStableFor({ upgradesPurchased });
  const valueOf = (i: InventoryItem) =>
    calculateCurrentValue(i, trends, noise, convention, stable);

  const displayedSet = new Set(displayedItemIds);
  const showcaseSet = new Set(showcaseItemIds);
  const sellable = (i: InventoryItem) => i.status === 'raw' || i.status === 'graded';
  const displayed = inventory.filter((i) => displayedSet.has(i.id) && sellable(i));
  // Showcased cards are off-limits — they're on display in the Collection.
  const stock = inventory
    .filter((i) => !displayedSet.has(i.id) && !showcaseSet.has(i.id) && sellable(i))
    .sort((a, b) => valueOf(b) - valueOf(a));
  const slotsFull = displayed.length >= tier.displaySlots;
  const emptySlots = Math.max(0, tier.displaySlots - displayed.length);
  const shopDisplayName = shopName.trim() || DEFAULT_SHOP_NAME;

  return (
    <div className="space-y-5">
      {/* Branded premises header */}
      <div className="rounded-xl border border-line bg-white shadow-card overflow-hidden">
        <div
          className="flex items-center gap-3 px-5 py-4 border-b border-line"
          style={{ background: `linear-gradient(to right, ${shopColor}1f, white)` }}
        >
          <div
            className="w-11 h-11 rounded-lg text-white flex items-center justify-center shrink-0"
            style={{ background: shopColor }}
          >
            <Icon name={shopLogo as IconName} size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-black leading-none text-ink-900">{shopDisplayName}</h1>
            <p className="text-ink-500 text-sm mt-1">
              {tier.name} · {tier.blurb}
            </p>
          </div>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-line">
          <ShopStat
            label="On display"
            value={`${displayed.length} / ${tier.displaySlots}`}
            accent="text-ink-900"
          />
          <ShopStat
            label="Foot traffic"
            value={`~${tier.trafficPerMin}/min`}
            accent="text-feebay-600"
          />
          <ShopStat
            label="Retail markup"
            value={`+${Math.round((tier.markup - 1) * 100)}%`}
            accent="text-ebayGreen-600"
          />
          <ShopStat label="Shop revenue" value={money(shopRevenue)} accent="text-ebayGreen-600" />
        </div>
      </div>

      {/* Premises upgrade */}
      {next ? (
        <div className="rounded-xl border border-line bg-white shadow-card p-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="min-w-0">
              <div className="text-[10px] uppercase tracking-widest text-ink-500 font-bold">
                Next premises
              </div>
              <div className="text-lg font-black text-ink-900">{next.name}</div>
              <div className="text-[12px] text-ink-500 mt-0.5">{next.blurb}</div>
              <div className="text-[11px] text-ink-600 mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5">
                <span>
                  {next.displaySlots} display slots{' '}
                  <span className="text-ebayGreen-600 font-semibold">
                    (+{next.displaySlots - tier.displaySlots})
                  </span>
                </span>
                <span>~{next.trafficPerMin}/min foot traffic</span>
                <span>+{Math.round((next.markup - 1) * 100)}% retail markup</span>
              </div>
            </div>
            <button
              onClick={upgradeShop}
              disabled={cash < next.cost}
              className={`shrink-0 rounded-md px-4 py-2 text-sm font-bold ${
                cash >= next.cost
                  ? 'bg-feebay-500 hover:bg-feebay-600 text-white'
                  : 'bg-ink-100 text-ink-400 cursor-not-allowed'
              }`}
            >
              Upgrade — {money(next.cost)}
            </button>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-line bg-white shadow-card p-4 text-sm text-ink-500">
          <span className="font-bold text-ink-800">{tier.name}</span> is the biggest shop
          there is — you've built the whole empire.
        </div>
      )}

      {/* On display */}
      <div>
        <h2 className="text-sm font-bold text-ink-800 mb-2">
          On display{' '}
          <span className="text-ink-400">
            ({displayed.length}/{tier.displaySlots})
          </span>
        </h2>
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
          {displayed.map((i) => (
            <div
              key={i.id}
              className="rounded-lg border border-line bg-white shadow-card p-2 flex flex-col items-center gap-1"
            >
              <CardArt
                small
                animated={false}
                name={i.name}
                rarity={i.rarity}
                hue={i.hue}
                cardId={i.cardId}
                grade={i.grade}
                gradingCompany={i.gradingCompany}
                centeringOffsetX={i.centeringOffsetX}
                centeringOffsetY={i.centeringOffsetY}
              />
              <div className="text-[10px] font-semibold text-ink-800 text-center leading-tight line-clamp-2 w-full">
                {i.name}
              </div>
              <div className="text-[10px] font-black text-ebayGreen-600">
                {money(valueOf(i) * tier.markup)}
              </div>
              <button
                onClick={() => undisplayItem(i.id)}
                className="w-full rounded border border-line hover:border-ebayRed-500 hover:text-ebayRed-500 text-ink-600 text-[10px] font-bold py-1"
              >
                Take down
              </button>
            </div>
          ))}
          {Array.from({ length: emptySlots }).map((_, k) => (
            <div
              key={`empty-${k}`}
              className="rounded-lg border border-dashed border-line bg-ink-100 flex items-center justify-center min-h-[160px] text-[10px] text-ink-400"
            >
              Empty case
            </div>
          ))}
        </div>
      </div>

      {/* Stock to display */}
      <div>
        <h2 className="text-sm font-bold text-ink-800 mb-2">
          Stock to display <span className="text-ink-400">({stock.length})</span>
        </h2>
        {stock.length === 0 ? (
          <div className="rounded-lg border border-dashed border-line p-8 text-center text-ink-500 text-sm">
            No spare stock. Buy or source cards, then put your best ones in the cases.
            Showcased cards stay in the Collection.
          </div>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3 max-h-[460px] overflow-y-auto pr-1">
            {stock.map((i) => (
              <div
                key={i.id}
                className="rounded-lg border border-line bg-white shadow-card p-2 flex flex-col items-center gap-1"
              >
                <CardArt
                  small
                  animated={false}
                  name={i.name}
                  rarity={i.rarity}
                  hue={i.hue}
                  cardId={i.cardId}
                  grade={i.grade}
                  gradingCompany={i.gradingCompany}
                  centeringOffsetX={i.centeringOffsetX}
                  centeringOffsetY={i.centeringOffsetY}
                />
                <div className="text-[10px] font-semibold text-ink-800 text-center leading-tight line-clamp-2 w-full">
                  {i.name}
                </div>
                <div className="text-[10px] text-ink-500">{money(valueOf(i))}</div>
                <button
                  onClick={() => displayItem(i.id)}
                  disabled={slotsFull}
                  className={`w-full rounded text-[10px] font-bold py-1 ${
                    slotsFull
                      ? 'bg-ink-100 text-ink-400 cursor-not-allowed'
                      : 'bg-feebay-50 text-feebay-700 border border-feebay-300 hover:bg-feebay-100'
                  }`}
                >
                  {slotsFull ? 'Cases full' : 'Display'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Walk-in activity */}
      <div>
        <h2 className="text-sm font-bold text-ink-800 mb-2">Walk-in activity</h2>
        {shopLog.length === 0 ? (
          <div className="rounded-lg border border-dashed border-line p-6 text-center text-ink-500 text-sm">
            No walk-ins yet. Put cards on display and customers will start buying.
          </div>
        ) : (
          <div className="rounded-lg border border-line bg-white shadow-card divide-y divide-lineSoft">
            {shopLog.map((s) => (
              <div key={s.id} className="flex items-center gap-2 px-3 py-1.5 text-[12px]">
                <Icon name="cash" size={12} className="text-ebayGreen-600 shrink-0" />
                <span className="flex-1 truncate text-ink-700">
                  A walk-in customer bought <span className="font-semibold">{s.name}</span>
                </span>
                <span className="font-bold text-ebayGreen-600 tabular-nums shrink-0">
                  +{money(s.price)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Shop branding */}
      <div>
        <h2 className="text-sm font-bold text-ink-800 mb-2">Shop branding</h2>
        <div className="rounded-xl border border-line bg-white shadow-card p-4 space-y-3.5">
          <div>
            <div className="text-[10px] uppercase tracking-widest text-ink-500 font-bold mb-1">
              Shop name
            </div>
            <input
              value={nameDraft}
              onChange={(e) => setNameDraft(e.target.value)}
              onBlur={() => updateBranding({ shopName: nameDraft })}
              onKeyDown={(e) => {
                if (e.key === 'Enter') e.currentTarget.blur();
              }}
              maxLength={28}
              placeholder={DEFAULT_SHOP_NAME}
              className="w-full max-w-sm rounded-md border border-line px-3 py-1.5 text-sm text-ink-900 focus:border-feebay-500 focus:outline-none"
            />
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-widest text-ink-500 font-bold mb-1">
              Logo
            </div>
            <div className="flex flex-wrap gap-1.5">
              {BRAND_LOGOS.map((ic) => {
                const on = shopLogo === ic;
                return (
                  <button
                    key={ic}
                    onClick={() => updateBranding({ shopLogo: ic })}
                    className={`w-9 h-9 rounded-md flex items-center justify-center border ${
                      on
                        ? 'border-transparent text-white'
                        : 'border-line text-ink-500 hover:border-ink-400'
                    }`}
                    style={on ? { background: shopColor } : undefined}
                  >
                    <Icon name={ic as IconName} size={16} />
                  </button>
                );
              })}
            </div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-widest text-ink-500 font-bold mb-1">
              Brand colour
            </div>
            <div className="flex flex-wrap gap-2">
              {BRAND_COLORS.map((c) => (
                <button
                  key={c.hex}
                  title={c.label}
                  onClick={() => updateBranding({ shopColor: c.hex })}
                  className={`w-8 h-8 rounded-full transition-transform hover:scale-110 ${
                    shopColor === c.hex ? 'ring-2 ring-offset-2 ring-ink-900' : ''
                  }`}
                  style={{ background: c.hex }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ShopStat({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent: string;
}) {
  return (
    <div className="bg-white px-4 py-3">
      <div className="text-[10px] uppercase tracking-widest text-ink-500 font-bold">{label}</div>
      <div className={`text-xl font-black leading-tight ${accent}`}>{value}</div>
    </div>
  );
}
