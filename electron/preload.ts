import { contextBridge, ipcRenderer } from 'electron';

function steamAvailable(): boolean {
  try {
    return ipcRenderer.sendSync('steam:available') === true;
  } catch {
    return false;
  }
}

contextBridge.exposeInMainWorld('feebay', {
  platform: process.platform,
  version: process.versions.electron,
  window: {
    minimize: () => ipcRenderer.send('window:minimize'),
    maximizeToggle: () => ipcRenderer.send('window:maximize-toggle'),
    close: () => ipcRenderer.send('window:close'),
    isMaximized: () => ipcRenderer.invoke('window:is-maximized') as Promise<boolean>,
    onStateChange: (cb: (state: { maximized: boolean }) => void) => {
      const handler = (_: unknown, state: { maximized: boolean }) => cb(state);
      ipcRenderer.on('window:state', handler);
      return () => ipcRenderer.removeListener('window:state', handler);
    },
  },
  steam: {
    available: steamAvailable(),
    cloudLoad: (): { state: string; savedAt: number } | null => {
      try {
        return ipcRenderer.sendSync('steam:cloud-load') ?? null;
      } catch {
        return null;
      }
    },
    cloudSave: (state: string, savedAt: number) => {
      try {
        ipcRenderer.send('steam:cloud-save', { state, savedAt });
      } catch {
        /* offline / steam unavailable — local save still holds */
      }
    },
  },
});
