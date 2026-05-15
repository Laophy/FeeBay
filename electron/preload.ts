import { contextBridge, ipcRenderer } from 'electron';

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
});
