import { useEffect, useState } from 'react';
import { useGameStore } from '../store/useGameStore';
import { Icon, type IconName } from './Icon';
import type { GameNotification } from '../types';

const KIND_STYLES: Record<string, string> = {
  info: 'border-line bg-white text-ink-900',
  success: 'border-l-4 border-ebayGreen-500 bg-white text-ebayGreen-700',
  warning: 'border-l-4 border-ebayYellow-500 bg-white text-ebayYellow-700',
  event: 'border-l-4 border-feebay-500 bg-white text-feebay-700',
  achievement: 'border-l-4 border-ebayYellow-500 bg-white text-ebayYellow-700',
};

const KIND_ICON: Record<string, IconName> = {
  info: 'check',
  success: 'check',
  warning: 'shield',
  event: 'sparkle',
  achievement: 'trophy',
};

const KIND_PROGRESS: Record<string, string> = {
  info: 'bg-ink-300',
  success: 'bg-ebayGreen-500',
  warning: 'bg-ebayYellow-500',
  event: 'bg-feebay-500',
  achievement: 'bg-ebayYellow-500',
};

const KIND_DURATION_MS: Record<string, number> = {
  info: 2500,
  success: 3000,
  warning: 4000,
  event: 4000,
  achievement: 4500,
};

const MAX_VISIBLE = 3;

export function NotificationStack() {
  const notifications = useGameStore((s) => s.notifications);
  const dismiss = useGameStore((s) => s.dismissNotification);
  const dismissAll = useGameStore((s) => s.dismissAllNotifications);

  const visible = notifications.slice(0, MAX_VISIBLE);
  const overflow = Math.max(0, notifications.length - MAX_VISIBLE);

  return (
    <div className="pointer-events-none fixed top-28 right-3 z-50 flex w-[18rem] flex-col gap-1.5">
      {visible.map((n) => (
        <Toast key={n.id} note={n} onDismiss={() => dismiss(n.id)} />
      ))}
      {overflow > 0 && (
        <button
          onClick={dismissAll}
          className="pointer-events-auto self-end text-[10px] uppercase tracking-widest font-bold text-ink-500 hover:text-ink-900 bg-white border border-line rounded-full px-2.5 py-1 shadow-sm"
        >
          +{overflow} more · clear all
        </button>
      )}
    </div>
  );
}

function Toast({ note, onDismiss }: { note: GameNotification; onDismiss: () => void }) {
  const duration = KIND_DURATION_MS[note.kind] ?? 3000;
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    const start = Date.now();
    const timer = setTimeout(onDismiss, duration);
    const tick = setInterval(() => {
      const elapsed = Date.now() - start;
      const pct = Math.max(0, 100 - (elapsed / duration) * 100);
      setProgress(pct);
    }, 60);
    return () => {
      clearTimeout(timer);
      clearInterval(tick);
    };
  }, [duration, onDismiss]);

  return (
    <button
      onClick={onDismiss}
      className={`pointer-events-auto select-none cursor-pointer text-left rounded-md border px-2.5 py-1.5 text-[12px] shadow-md animate-slideIn flex items-start gap-1.5 relative overflow-hidden ${
        KIND_STYLES[note.kind] ?? KIND_STYLES.info
      }`}
    >
      <Icon
        name={KIND_ICON[note.kind] ?? 'check'}
        size={13}
        className="mt-0.5 shrink-0 opacity-80"
      />
      <span className="flex-1 leading-snug">{note.message}</span>
      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-ink-100">
        <div
          className={`h-full transition-[width] duration-75 ease-linear ${
            KIND_PROGRESS[note.kind] ?? KIND_PROGRESS.info
          }`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </button>
  );
}
