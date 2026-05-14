import { contextBridge } from 'electron';

contextBridge.exposeInMainWorld('feebay', {
  platform: process.platform,
  version: process.versions.electron,
});
