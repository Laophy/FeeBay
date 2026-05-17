import { useEffect, useRef, useState } from 'react';
import { useGameStore } from '../store/useGameStore';
import type { CheatId } from '../store/useGameStore';
import { Icon } from './Icon';
import type { IconName } from './Icon';

/** Tongue-in-cheek "hacker boot sequence" shown when the dev console opens. */
const BOOT_LINES: string[] = [
  'feebay-os v0.1.3 — proprietary build, do not distribute',
  'initializing kernel modules ............... ok',
  'connecting to feebay mainframe ............ ok',
  'authenticating as guest ................... DENIED',
  'escalating privileges ..................... DENIED',
  'retrying with password "password123" ...... ACCEPTED',
  'mounting /admin/secret/do_not_ship_this ... ok',
  'disabling audit log ....................... ok (nobody saw this)',
  'spawning developer console ................ ok',
  '',
  '   >>>  R O O T   A C C E S S   G R A N T E D  <<<',
  '',
  'WARNING: you were never here.',
];

/** Deadpan fake "server status" lines for the admin panel header. */
const FAKE_STATS: [string, string][] = [
  ['logged in as', 'root@feebay'],
  ['last login', 'never (suspicious)'],
  ['players online', '1 — just you'],
  ['server location', "under the dev's desk"],
  ['database backups', 'lol, no'],
  ['pending lawsuits', '3'],
  ['coffee reserves', 'CRITICALLY LOW'],
  ['build flag', 'SHIP_IT=maybe'],
];

type Cheat = {
  cheat: CheatId;
  amount?: number;
  icon: IconName;
  label: string;
  blurb: string;
  /** funny line appended to the command log when executed */
  log: string;
};

const CASH_CHEATS: Cheat[] = [
  { cheat: 'cash', amount: 1_000, icon: 'cash', label: '+$1K', blurb: 'pocket change', log: 'wired $1,000 from an account that definitely exists' },
  { cheat: 'cash', amount: 10_000, icon: 'cash', label: '+$10K', blurb: 'a tidy stack', log: 'laundered $10,000 through three fake binders' },
  { cheat: 'cash', amount: 100_000, icon: 'wallet', label: '+$100K', blurb: 'now we talk', log: '$100,000 appeared — do not ask questions' },
  { cheat: 'cash', amount: 1_000_000, icon: 'wallet', label: '+$1M', blurb: 'instant tycoon', log: '$1,000,000 deposited; the IRS has been notified (lying)' },
];

const POWER_CHEATS: Cheat[] = [
  { cheat: 'unlock_upgrades', icon: 'upgrades', label: 'Unlock ALL Upgrades', blurb: 'every gadget, free', log: 'every upgrade flag flipped to TRUE' },
  { cheat: 'unlock_marketplaces', icon: 'trends', label: 'Unlock ALL Marketplaces', blurb: 'open every storefront', log: 'all marketplaces force-unlocked' },
  { cheat: 'max_reputation', icon: 'medal', label: 'Max Reputation', blurb: 'instant local legend', log: 'reputation cranked to 999 — the people love you' },
  { cheat: 'max_business', icon: 'crown', label: 'Max Business Level', blurb: 'skip the grind', log: 'promoted straight to the top of the org chart' },
  { cheat: 'skip_day', icon: 'reset', label: 'Skip to Next Day', blurb: 'fast-forward time', log: 'day clock yanked forward — time is a construct' },
  { cheat: 'unlock_achievements', icon: 'trophy', label: 'Unlock ALL Achievements', blurb: 'or so it claims...', log: 'nice try — the only badge that unlocked was "Nice Try", reserved for cheaters' },
];

export function CheatsModal() {
  const open = useGameStore((s) => s.cheatsConsoleOpen);
  const close = useGameStore((s) => s.closeCheatsConsole);
  const applyCheat = useGameStore((s) => s.applyCheat);

  const [booted, setBooted] = useState(false);
  const [shownLines, setShownLines] = useState(0);
  const [log, setLog] = useState<string[]>([]);
  const logRef = useRef<HTMLDivElement>(null);

  // Run the boot sequence whenever the console opens; fully reset when it closes.
  useEffect(() => {
    if (!open) {
      setBooted(false);
      setShownLines(0);
      setLog([]);
      return;
    }
    let n = 0;
    const id = setInterval(() => {
      n += 1;
      setShownLines(n);
      if (n >= BOOT_LINES.length) {
        clearInterval(id);
        setTimeout(() => setBooted(true), 350);
      }
    }, 150);
    return () => clearInterval(id);
  }, [open]);

  // Escape logs out.
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') close();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, close]);

  // Keep the command log scrolled to the newest line.
  useEffect(() => {
    const el = logRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [log]);

  if (!open) return null;

  const skipBoot = () => {
    setShownLines(BOOT_LINES.length);
    setBooted(true);
  };

  const runCheat = (c: Cheat) => {
    applyCheat(c.cheat, c.amount);
    const stamp = new Date().toLocaleTimeString();
    const call = `${c.cheat}(${c.amount ?? ''})`;
    setLog((l) => [...l, `[${stamp}] EXEC ${call} — ${c.log}`].slice(-40));
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/85 p-3 sm:p-6">
      <div className="cheat-crt relative w-[min(880px,97vw)] max-h-[94vh] overflow-hidden rounded-lg border border-[#1f5d34] bg-[#050a06] font-mono text-[#4ee37a] shadow-[0_0_60px_rgba(40,220,90,0.25)]">
        {/* Title bar */}
        <div className="flex items-center gap-2 border-b border-[#1f5d34] bg-[#08130b] px-4 py-2 text-xs">
          <Icon name="bolt" size={13} className="text-[#4ee37a]" />
          <span className="font-bold tracking-widest">FeeBay // ADMIN CONSOLE</span>
          <span className="hidden text-[#2f8a4d] sm:inline">— /admin/secret/do_not_ship_this</span>
          <button
            onClick={close}
            className="ml-auto flex items-center gap-1 rounded border border-[#1f5d34] px-2 py-0.5 text-[10px] tracking-widest text-[#4ee37a] hover:bg-[#13301c]"
          >
            <Icon name="x" size={11} /> LOG OUT
          </button>
        </div>

        <div className="cheat-scroll max-h-[calc(94vh-2.4rem)] overflow-y-auto p-4 text-sm leading-relaxed sm:p-5">
          {/* Boot terminal */}
          <div className="rounded border border-[#143d22] bg-black/60 p-3 text-[12px]">
            {BOOT_LINES.slice(0, shownLines).map((line, i) => {
              const banner = line.startsWith(' ');
              const granted = line.includes('G R A N T E D') || line.includes('ACCEPTED');
              const denied = line.includes('DENIED');
              const warn = line.startsWith('WARNING');
              const color = denied
                ? 'text-[#ff6b6b]'
                : warn
                  ? 'text-[#ffd24a]'
                  : granted
                    ? 'font-bold text-[#7dffa3]'
                    : 'text-[#3aa860]';
              return (
                <div key={i} className={color}>
                  {line === '' ? ' ' : `${banner ? '' : '> '}${line}`}
                </div>
              );
            })}
            {shownLines < BOOT_LINES.length && (
              <div className="mt-1 flex items-center gap-2">
                <span className="text-[#3aa860]">&gt;</span>
                <span className="cheat-cursor inline-block h-3 w-2 bg-[#4ee37a]" />
                <button
                  onClick={skipBoot}
                  className="ml-2 rounded border border-[#1f5d34] px-2 py-0.5 text-[10px] tracking-widest hover:bg-[#13301c]"
                >
                  [ SKIP ]
                </button>
              </div>
            )}
          </div>

          {booted && (
            <div className="cheat-fade mt-4">
              {/* Granted banner */}
              <div className="rounded border border-[#1f5d34] bg-[#0c1f12] px-4 py-3">
                <div className="cheat-flicker text-base font-bold tracking-widest text-[#7dffa3]">
                  ☠ ROOT ACCESS GRANTED ☠
                </div>
                <div className="mt-1 text-[11px] text-[#2f8a4d]">
                  You found the secret <span className="text-[#4ee37a]">/cheats</span> developer console.
                  Everything below is for testing &amp; QA. Yes, it counts as cheating. No, we won't tell.
                </div>
              </div>

              {/* Fake server status */}
              <div className="mt-4 rounded border border-[#143d22] bg-black/40 p-3">
                <div className="mb-2 text-[10px] uppercase tracking-[0.25em] text-[#2f8a4d]">
                  system status
                </div>
                <div className="grid grid-cols-1 gap-x-6 gap-y-1 text-[11px] sm:grid-cols-2">
                  {FAKE_STATS.map(([k, v]) => (
                    <div key={k} className="flex justify-between gap-3">
                      <span className="text-[#2f8a4d]">{k}</span>
                      <span className="text-[#4ee37a]">{v}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Inject funds */}
              <div className="mt-4">
                <div className="mb-2 flex items-center gap-2 text-[10px] uppercase tracking-[0.25em] text-[#2f8a4d]">
                  <Icon name="cash" size={12} /> inject funds
                </div>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {CASH_CHEATS.map((c) => (
                    <button
                      key={c.label}
                      onClick={() => runCheat(c)}
                      className="cheat-btn flex flex-col items-center gap-0.5 rounded border border-[#1f5d34] bg-[#0a1a0f] px-2 py-2.5 hover:bg-[#13301c]"
                    >
                      <span className="text-sm font-bold text-[#7dffa3]">{c.label}</span>
                      <span className="text-[9px] text-[#2f8a4d]">{c.blurb}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Power cheats */}
              <div className="mt-4">
                <div className="mb-2 flex items-center gap-2 text-[10px] uppercase tracking-[0.25em] text-[#2f8a4d]">
                  <Icon name="bolt" size={12} /> developer overrides
                </div>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {POWER_CHEATS.map((c) => (
                    <button
                      key={c.label}
                      onClick={() => runCheat(c)}
                      className="cheat-btn flex items-center gap-3 rounded border border-[#1f5d34] bg-[#0a1a0f] px-3 py-2.5 text-left hover:bg-[#13301c]"
                    >
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded border border-[#1f5d34] bg-black/50 text-[#4ee37a]">
                        <Icon name={c.icon} size={15} />
                      </span>
                      <span className="min-w-0">
                        <span className="block text-[13px] font-bold text-[#7dffa3]">{c.label}</span>
                        <span className="block text-[10px] text-[#2f8a4d]">{c.blurb}</span>
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Command log */}
              <div className="mt-4">
                <div className="mb-2 text-[10px] uppercase tracking-[0.25em] text-[#2f8a4d]">
                  command log
                </div>
                <div
                  ref={logRef}
                  className="cheat-scroll h-28 overflow-y-auto rounded border border-[#143d22] bg-black/60 p-2 text-[11px]"
                >
                  {log.length === 0 ? (
                    <div className="text-[#2f8a4d]">
                      &gt; awaiting input... (run a cheat above — it applies &amp; saves instantly)
                    </div>
                  ) : (
                    log.map((line, i) => (
                      <div key={i} className="text-[#3aa860]">
                        {line}
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-[#143d22] pt-3 text-[10px] text-[#2f8a4d]">
                <Icon name="shield" size={12} />
                <span>this console is testing-only. cheats apply immediately and persist to your save.</span>
                <button
                  onClick={close}
                  className="ml-auto rounded border border-[#1f5d34] px-3 py-1 text-[10px] tracking-widest text-[#4ee37a] hover:bg-[#13301c]"
                >
                  [ LOG OUT — ESC ]
                </button>
              </div>
            </div>
          )}
        </div>

        <style>{`
          @keyframes cheatCursorBlink { 0%, 49% { opacity: 1; } 50%, 100% { opacity: 0; } }
          .cheat-cursor { animation: cheatCursorBlink 0.9s steps(1) infinite; }
          @keyframes cheatFlicker {
            0%, 92%, 100% { opacity: 1; }
            93% { opacity: 0.35; }
            95% { opacity: 1; }
            97% { opacity: 0.55; }
          }
          .cheat-flicker { animation: cheatFlicker 4.2s linear infinite; }
          @keyframes cheatFade { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
          .cheat-fade { animation: cheatFade 0.28s ease-out both; }
          .cheat-btn { transition: transform 0.08s ease, background-color 0.12s ease; }
          .cheat-btn:active { transform: scale(0.97); }
          .cheat-crt::after {
            content: '';
            position: absolute;
            inset: 0;
            pointer-events: none;
            background: repeating-linear-gradient(
              to bottom,
              rgba(0,0,0,0) 0px,
              rgba(0,0,0,0) 2px,
              rgba(0,0,0,0.18) 3px,
              rgba(0,0,0,0) 4px
            );
            mix-blend-mode: multiply;
          }
          .cheat-scroll::-webkit-scrollbar { width: 8px; }
          .cheat-scroll::-webkit-scrollbar-track { background: #050a06; }
          .cheat-scroll::-webkit-scrollbar-thumb { background: #1f5d34; border-radius: 4px; }
        `}</style>
      </div>
    </div>
  );
}
