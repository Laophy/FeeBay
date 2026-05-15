import { useEffect, useState } from 'react';
import { useGameStore } from '../store/useGameStore';
import { Icon, type IconName } from './Icon';
import type { GameNotification } from '../types';

const KIND_STYLES: Record<string, string> = {
  info: 'border-line bg-white text-ink-800',
  success: 'border-l-2 border-ebayGreen-500 bg-white text-ebayGreen-700',
  warning: 'border-l-2 border-ebayYellow-500 bg-white text-ebayYellow-700',
  event: 'border-l-2 border-feebay-500 bg-white text-feebay-700',
  achievement: 'border-l-2 border-ebayYellow-500 bg-white text-ebayYellow-700',
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

/** Notification feed embedded at the bottom of the sidebar. */
export function NotificationStack() {
  const notifications = useGameStore((s) => s.notifications);
  const dismissAll = useGameStore((s) => s.dismissAllNotifications);

  if (notifications.length === 0) return null;

  const visible = notifications.slice(0, MAX_VISIBLE);
  const overflow = Math.max(0, notifications.length - MAX_VISIBLE);

  return (
    <div className="px-2 pt-2 pb-1 border-t border-line">
      <div className="flex items-center justify-between px-1 pb-1">
        <span className="text-[9px] uppercase tracking-[0.18em] font-bold text-ink-400">
          Activity
        </span>
        <button
          onClick={dismissAll}
          className="text-[9px] uppercase tracking-widest font-bold text-ink-400 hover:text-ink-700"
        >
          Clear{overflow > 0 ? ` (${notifications.length})` : ''}
        </button>
      </div>
      <div className="flex flex-col gap-1">
        {visible.map((n) => (
          <Toast key={n.id} note={n} />
        ))}
      </div>
      <style>{`
        @keyframes notiSlideIn {
          0%   { opacity: 0; transform: translateY(10px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        .noti-slide-in {
          animation: notiSlideIn 0.26s cubic-bezier(0.22, 1, 0.36, 1) both;
        }
      `}</style>
    </div>
  );
}

function Toast({ note }: { note: GameNotification }) {
  const dismiss = useGameStore((s) => s.dismissNotification);
  const duration = KIND_DURATION_MS[note.kind] ?? 3000;
  const [progress, setProgress] = useState(100);
  const onDismiss = () => dismiss(note.id);

  // Keyed only on the notification id + duration so parent re-renders (game ticks)
  // never restart the countdown. `dismiss` is a stable zustand action reference.
  useEffect(() => {
    const start = Date.now();
    const timer = setTimeout(() => dismiss(note.id), duration);
    const tick = setInterval(() => {
      const elapsed = Date.now() - start;
      setProgress(Math.max(0, 100 - (elapsed / duration) * 100));
    }, 60);
    return () => {
      clearTimeout(timer);
      clearInterval(tick);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [note.id, duration]);

  return (
    <button
      onClick={onDismiss}
      className={`noti-slide-in select-none cursor-pointer text-left rounded-md border px-2 py-1.5 text-[11px] shadow-sm flex items-start gap-1.5 relative overflow-hidden ${
        KIND_STYLES[note.kind] ?? KIND_STYLES.info
      }`}
    >
      <Icon
        name={KIND_ICON[note.kind] ?? 'check'}
        size={12}
        className="mt-0.5 shrink-0 opacity-80"
      />
      <span className="flex-1 leading-snug">{note.message}</span>
      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-ink-100">
        <div
          className={`h-full ${KIND_PROGRESS[note.kind] ?? KIND_PROGRESS.info}`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </button>
  );
}
