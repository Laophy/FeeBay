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
        isMaximized: () => Promise<boolean>;
        onStateChange: (cb: (state: { maximized: boolean }) => void) => () => void;
      };
    };
  }
}

export {};
