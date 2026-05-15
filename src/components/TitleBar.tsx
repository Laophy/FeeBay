import { useEffect, useState } from 'react';
import { APP_VERSION } from '../version';

/**
 * Custom Electron title bar. Light theme, eBay-style colorful logo letters.
 * Drag region everywhere except the buttons (no-drag).
 */
export function TitleBar() {
  const [maximized, setMaximized] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);

  useEffect(() => {
    const ctrl = window.feebay?.window;
    if (!ctrl) return;
    ctrl.isMaximized().then(setMaximized);
    ctrl.isFullScreen().then(setFullscreen);
    const off = ctrl.onStateChange((s) => {
      setMaximized(s.maximized);
      setFullscreen(s.fullscreen);
    });
    return off;
  }, []);

  const ctrl = window.feebay?.window;

  return (
    <div
      className="relative z-10 flex items-center h-8 bg-white border-b border-line shrink-0"
      style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
    >
      <div className="flex items-center gap-1 px-3 font-black text-[14px] tracking-tight">
        <span className="text-ebayRed-500">F</span>
        <span className="text-feebay-500">e</span>
        <span className="text-ebayYellow-500">e</span>
        <span className="text-ebayGreen-500">B</span>
        <span className="text-ebayRed-500">a</span>
        <span className="text-feebay-500">y</span>
        <span className="text-ink-500 ml-1.5 font-medium text-[11px] tracking-wide">
          Simulator
        </span>
        <span className="text-ink-400 ml-1 font-bold text-[10px] tracking-widest tabular-nums">
          {APP_VERSION}
        </span>
      </div>

      <div className="flex-1" />

      <div
        className="flex items-stretch h-full"
        style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
      >
        <TitleBarButton
          onClick={() => ctrl?.fullscreenToggle()}
          aria-label={fullscreen ? 'Exit full screen' : 'Full screen'}
        >
          {fullscreen ? (
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
              <path
                d="M3.5 .5V3.5H.5 M6.5 .5V3.5H9.5 M.5 6.5H3.5V9.5 M9.5 6.5H6.5V9.5"
                stroke="currentColor"
                strokeWidth="1.1"
              />
            </svg>
          ) : (
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
              <path
                d="M3.6 .5H.5V3.6 M6.4 .5H9.5V3.6 M.5 6.4V9.5H3.6 M9.5 6.4V9.5H6.4"
                stroke="currentColor"
                strokeWidth="1.1"
              />
            </svg>
          )}
        </TitleBarButton>
        <TitleBarButton onClick={() => ctrl?.minimize()} aria-label="Minimize">
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <path d="M0 5 H10" stroke="currentColor" strokeWidth="1.1" />
          </svg>
        </TitleBarButton>
        <TitleBarButton
          onClick={() => ctrl?.maximizeToggle()}
          aria-label={maximized ? 'Restore' : 'Maximize'}
        >
          {maximized ? (
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
              <rect x="2.5" y="0.5" width="7" height="7" stroke="currentColor" strokeWidth="0.9" />
              <rect
                x="0.5"
                y="2.5"
                width="7"
                height="7"
                fill="#ffffff"
                stroke="currentColor"
                strokeWidth="0.9"
              />
            </svg>
          ) : (
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
              <rect x="0.5" y="0.5" width="9" height="9" stroke="currentColor" strokeWidth="0.9" />
            </svg>
          )}
        </TitleBarButton>
        <TitleBarButton onClick={() => ctrl?.close()} aria-label="Close" danger>
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <path d="M0 0 L10 10 M10 0 L0 10" stroke="currentColor" strokeWidth="1.1" />
          </svg>
        </TitleBarButton>
      </div>
    </div>
  );
}

function TitleBarButton({
  onClick,
  children,
  danger,
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { danger?: boolean }) {
  return (
    <button
      onClick={onClick}
      className={`w-11 h-full flex items-center justify-center text-ink-600 ${
        danger ? 'hover:bg-ebayRed-500 hover:text-white' : 'hover:bg-ink-100 hover:text-ink-900'
      } transition`}
      {...rest}
    >
      {children}
    </button>
  );
}
