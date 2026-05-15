import { useEffect } from 'react';
import { useGameStore } from '../store/useGameStore';
import { Icon, type IconName } from './Icon';

const KIND_STYLES: Record<string, string> = {
  info: 'border-line bg-white text-ink-900',
  success: 'border-ebayGreen-500 bg-white text-ebayGreen-700 border-l-4',
  warning: 'border-ebayYellow-500 bg-white text-ebayYellow-700 border-l-4',
  event: 'border-feebay-500 bg-white text-feebay-700 border-l-4',
  achievement: 'border-ebayYellow-500 bg-white text-ebayYellow-700 border-l-4',
};

const KIND_ICON: Record<string, IconName> = {
  info: 'check',
  success: 'check',
  warning: 'shield',
  event: 'sparkle',
  achievement: 'trophy',
};

export function NotificationStack() {
  const notifications = useGameStore((s) => s.notifications);
  const dismiss = useGameStore((s) => s.dismissNotification);
  const top = notifications.slice(0, 4);

  useEffect(() => {
    const timers = top.map((n) => setTimeout(() => dismiss(n.id), 5500));
    return () => timers.forEach(clearTimeout);
  }, [top, dismiss]);

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-50 flex w-[22rem] flex-col gap-2">
      {top.map((n) => (
        <button
          key={n.id}
          onClick={() => dismiss(n.id)}
          className={`pointer-events-auto select-none cursor-pointer text-left rounded-md border px-3 py-2 text-sm shadow-lg backdrop-blur-sm animate-slideIn flex items-start gap-2 ${
            KIND_STYLES[n.kind] ?? KIND_STYLES.info
          }`}
        >
          <Icon
            name={KIND_ICON[n.kind] ?? 'check'}
            size={16}
            className="mt-0.5 shrink-0 opacity-80"
          />
          <span className="flex-1">{n.message}</span>
        </button>
      ))}
    </div>
  );
}
