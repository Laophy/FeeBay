import { useRef, type ChangeEvent, type ReactNode } from 'react';
import { useGameStore } from '../../store/useGameStore';
import { SFX, setMuted, setVolume, useMuted, useVolume } from '../../game/audio';
import { exportSave, importSave } from '../../game/saveSystem';

/** Auto-backup frequency options (minutes; 0 = off). */
const BACKUP_OPTIONS: { label: string; min: number }[] = [
  { label: 'Off', min: 0 },
  { label: '10m', min: 10 },
  { label: '30m', min: 30 },
  { label: '1h', min: 60 },
];

/** Dashboard settings card — audio, the daily summary popup, and save backup. */
export function SettingsPanel() {
  const dailyModalEnabled = useGameStore((s) => s.dailyModalEnabled);
  const setDailyModalEnabled = useGameStore((s) => s.setDailyModalEnabled);
  const backupIntervalMin = useGameStore((s) => s.backupIntervalMin);
  const setBackupInterval = useGameStore((s) => s.setBackupInterval);
  const save = useGameStore((s) => s.save);

  const backupAvailable = typeof window !== 'undefined' && !!window.feebay?.backup;

  const audioOn = !useMuted();
  const volume = useVolume();
  const fileRef = useRef<HTMLInputElement>(null);

  function toggleAudio() {
    setMuted(audioOn); // currently on -> mute; currently off -> unmute
    if (!audioOn) SFX.coin();
  }

  function handleVolume(v: number) {
    setVolume(v);
  }

  function handleExport() {
    save();
    const data = exportSave();
    if (!data) {
      window.alert('No save data to export yet.');
      return;
    }
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `feebay-save-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleImport(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ''; // allow re-picking the same file
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result ?? '');
      if (
        !window.confirm(
          'Importing this save replaces your current game. This cannot be undone — continue?',
        )
      ) {
        return;
      }
      if (importSave(text)) {
        window.location.reload();
      } else {
        window.alert('That file is not a valid FeeBay save.');
      }
    };
    reader.readAsText(file);
  }

  return (
    <div className="rounded-xl border border-line bg-white shadow-card p-4">
      <div className="text-[11px] uppercase tracking-[0.18em] text-ink-500 font-bold mb-1">
        Settings
      </div>

      <div className="divide-y divide-lineSoft">
        <SettingRow label="Sound effects" desc="Coins, card flips, achievement chimes.">
          <Toggle on={audioOn} onChange={toggleAudio} />
        </SettingRow>

        {audioOn && (
          <SettingRow label="Volume" desc="How loud the sound effects play.">
            <div className="flex items-center gap-2 w-40">
              <input
                type="range"
                min={0}
                max={100}
                value={Math.round(volume * 100)}
                onChange={(e) => handleVolume(Number(e.target.value) / 100)}
                onPointerUp={() => SFX.coin()}
                className="flex-1 accent-feebay-500 cursor-pointer"
              />
              <span className="text-xs font-bold text-ink-700 tabular-nums w-9 text-right">
                {Math.round(volume * 100)}%
              </span>
            </div>
          </SettingRow>
        )}

        <SettingRow
          label="Daily summary popup"
          desc="Show the end-of-day report each time a day rolls over."
        >
          <Toggle on={dailyModalEnabled} onChange={setDailyModalEnabled} />
        </SettingRow>
      </div>

      <div className="mt-3 pt-3 border-t border-line">
        <div className="text-[10px] uppercase tracking-widest text-ink-500 font-bold mb-2">
          Save data
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleExport}
            className="flex-1 rounded-md border border-line hover:border-feebay-500 hover:text-feebay-600 text-ink-700 text-xs font-bold py-2"
          >
            Export save
          </button>
          <button
            onClick={() => fileRef.current?.click()}
            className="flex-1 rounded-md border border-line hover:border-feebay-500 hover:text-feebay-600 text-ink-700 text-xs font-bold py-2"
          >
            Import save
          </button>
        </div>
        <p className="text-[10px] text-ink-400 mt-1.5">
          Export downloads a backup file. Importing replaces your current game.
        </p>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          onChange={handleImport}
          className="hidden"
        />

        {backupAvailable && (
          <div className="mt-3 pt-3 border-t border-line">
            <div className="flex items-center justify-between gap-3 mb-2">
              <div className="min-w-0">
                <div className="text-sm font-semibold text-ink-800">Automatic backups</div>
                <div className="text-[11px] text-ink-500">
                  Saves a timestamped copy to a folder on your PC.
                </div>
              </div>
              <div className="flex gap-1 shrink-0">
                {BACKUP_OPTIONS.map((o) => (
                  <button
                    key={o.min}
                    onClick={() => setBackupInterval(o.min)}
                    className={`px-2.5 py-0.5 rounded text-[10px] font-bold transition-colors ${
                      backupIntervalMin === o.min
                        ? 'bg-feebay-500 text-white'
                        : 'bg-ink-100 text-ink-500 hover:bg-ink-200'
                    }`}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            </div>
            <button
              onClick={() => void window.feebay?.backup?.openFolder()}
              className="w-full rounded-md border border-line hover:border-feebay-500 hover:text-feebay-600 text-ink-700 text-xs font-bold py-2"
            >
              View backup folder
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function SettingRow({
  label,
  desc,
  children,
}: {
  label: string;
  desc: string;
  children: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3 py-2.5">
      <div className="min-w-0">
        <div className="text-sm font-semibold text-ink-800">{label}</div>
        <div className="text-[11px] text-ink-500">{desc}</div>
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={() => onChange(!on)}
      className={`relative w-9 h-5 rounded-full transition-colors shrink-0 ${
        on ? 'bg-feebay-500' : 'bg-ink-300'
      }`}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${
          on ? 'translate-x-4' : ''
        }`}
      />
    </button>
  );
}
