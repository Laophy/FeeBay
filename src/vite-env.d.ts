/// <reference types="vite/client" />

declare global {
  interface Window {
    feebay?: {
      platform: string;
      version: string;
      window?: {
        minimize: () => void;
        maximizeToggle: () => void;
        close: () => void;
        fullscreenToggle: () => void;
        isMaximized: () => Promise<boolean>;
        isFullScreen: () => Promise<boolean>;
        onStateChange: (
          cb: (state: { maximized: boolean; fullscreen: boolean }) => void,
        ) => () => void;
      };
      steam?: {
        /** True when the Steam client initialized successfully this session. */
        available: boolean;
        /** Synchronously read the Steam Cloud save. Returns null if unavailable/empty. */
        cloudLoad: () => { state: string; savedAt: number } | null;
        /** Push the save to Steam Cloud (fire-and-forget). */
        cloudSave: (state: string, savedAt: number) => void;
        /** Unlock a Steam achievement by id (matches the in-game achievement id). */
        unlockAchievement: (id: string) => void;
      };
    };
  }
}

export {};
