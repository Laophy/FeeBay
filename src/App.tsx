import { useEffect, useState } from 'react';
import { useGameStore } from './store/useGameStore';
import { Sidebar } from './components/Sidebar';
import { TopBar } from './components/TopBar';
import { Dashboard } from './features/dashboard/Dashboard';
import { Marketplace } from './features/marketplace/Marketplace';
import { Inventory } from './features/inventory/Inventory';
import { Grading } from './features/grading/Grading';
import { Upgrades } from './features/upgrades/Upgrades';
import { MarketTrends } from './features/market/MarketTrends';
import { Auctions } from './features/auctions/Auctions';
import { Achievements } from './features/achievements/Achievements';
import { Collection } from './features/collection/Collection';
import { Stats } from './features/stats/Stats';
import { Storefront } from './features/storefront/Storefront';
import { NotificationStack } from './components/NotificationStack';
import { GradingRevealModal } from './components/GradingRevealModal';
import { LotRevealModal } from './components/LotRevealModal';
import { IntroModal } from './components/IntroModal';
import { EndOfDayModal } from './components/EndOfDayModal';

export type Route =
  | 'dashboard'
  | 'marketplace'
  | 'inventory'
  | 'storefront'
  | 'grading'
  | 'trends'
  | 'auctions'
  | 'upgrades'
  | 'collection'
  | 'stats'
  | 'achievements';

export default function App() {
  const [route, setRoute] = useState<Route>('dashboard');
  const init = useGameStore((s) => s.init);
  const resolveDueGrading = useGameStore((s) => s.resolveDueGrading);
  const tickTrends = useGameStore((s) => s.tickTrends);
  const triggerMarketEvent = useGameStore((s) => s.triggerMarketEvent);
  const lastMarketEvent = useGameStore((s) => s.lastMarketEvent);
  const tickAuctions = useGameStore((s) => s.tickAuctions);
  const tickListings = useGameStore((s) => s.tickListings);
  const tickDay = useGameStore((s) => s.tickDay);
  const tickMarketNoise = useGameStore((s) => s.tickMarketNoise);
  const tickConvention = useGameStore((s) => s.tickConvention);
  const tickPlayerListings = useGameStore((s) => s.tickPlayerListings);
  const tickHiredHelp = useGameStore((s) => s.tickHiredHelp);
  const sampleNetWorth = useGameStore((s) => s.sampleNetWorth);
  const refreshListings = useGameStore((s) => s.refreshListings);
  const lastListingRefresh = useGameStore((s) => s.lastListingRefresh);
  const listingsCount = useGameStore((s) => s.listings.length);
  const totalBought = useGameStore((s) => s.stats.totalBought);
  const auctionUnlocked = useGameStore((s) => s.upgradesPurchased.includes('auction_paddle'));
  const gradingUnlocked = useGameStore(
    (s) =>
      s.upgradesPurchased.includes('grading_membership') ||
      s.upgradesPurchased.includes('bucket_membership') ||
      s.upgradesPurchased.includes('pza_membership'),
  );

  useEffect(() => {
    // If the currently-active route just became locked, snap back to dashboard.
    if (route === 'storefront' && totalBought === 0) setRoute('dashboard');
    if (route === 'grading' && !gradingUnlocked) setRoute('dashboard');
    if (route === 'auctions' && !auctionUnlocked) setRoute('dashboard');
  }, [route, totalBought, gradingUnlocked, auctionUnlocked]);

  useEffect(() => {
    init();
  }, [init]);

  useEffect(() => {
    const id = setInterval(() => {
      resolveDueGrading();
      tickTrends();
      tickAuctions();
      tickListings();
      tickDay();
      tickMarketNoise();
      tickConvention();
      tickPlayerListings();
      tickHiredHelp();
    }, 1000);
    return () => clearInterval(id);
  }, [
    resolveDueGrading,
    tickTrends,
    tickAuctions,
    tickListings,
    tickDay,
    tickMarketNoise,
    tickConvention,
    tickPlayerListings,
    tickHiredHelp,
  ]);

  useEffect(() => {
    const id = setInterval(() => {
      const now = Date.now();
      if (now - lastMarketEvent > 60_000) {
        triggerMarketEvent();
      }
    }, 15_000);
    return () => clearInterval(id);
  }, [triggerMarketEvent, lastMarketEvent]);

  useEffect(() => {
    const id = setInterval(sampleNetWorth, 5_000);
    sampleNetWorth();
    return () => clearInterval(id);
  }, [sampleNetWorth]);

  useEffect(() => {
    const id = setInterval(() => {
      const now = Date.now();
      const stale = now - lastListingRefresh > 120_000;
      if (listingsCount < 4 || stale) {
        refreshListings({ force: true });
      }
    }, 20_000);
    return () => clearInterval(id);
  }, [refreshListings, lastListingRefresh, listingsCount]);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-950 text-slate-100 select-none">
      <Sidebar route={route} setRoute={setRoute} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <TopBar route={route} />
        <main className="flex-1 overflow-y-auto p-6">
          {route === 'dashboard' && <Dashboard onNavigate={setRoute} />}
          {route === 'marketplace' && <Marketplace />}
          {route === 'inventory' && <Inventory />}
          {route === 'storefront' && <Storefront />}
          {route === 'grading' && <Grading />}
          {route === 'trends' && <MarketTrends />}
          {route === 'auctions' && <Auctions />}
          {route === 'upgrades' && <Upgrades />}
          {route === 'collection' && <Collection />}
          {route === 'stats' && <Stats />}
          {route === 'achievements' && <Achievements />}
        </main>
      </div>
      <NotificationStack />
      <LotRevealModal />
      <GradingRevealModal />
      <EndOfDayModal />
      <IntroModal />
    </div>
  );
}
