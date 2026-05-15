import { app, BrowserWindow, ipcMain, shell } from 'electron';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);

process.env.APP_ROOT = path.join(__dirname, '..');
const VITE_DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL;
const MAIN_DIST = path.join(process.env.APP_ROOT, 'dist-electron');
const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist');

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL
  ? path.join(process.env.APP_ROOT, 'public')
  : RENDERER_DIST;

// Keep all game data (save file, caches, localStorage) under a clean "FeeBay"
// folder rather than the package name. Must run before the app is ready.
app.setName('FeeBay');
app.setPath('userData', path.join(app.getPath('appData'), 'FeeBay'));
// Ensures Windows groups the app and shows the right taskbar icon.
app.setAppUserModelId('com.feebay.simulator');

// Window/taskbar icon. In packaged builds the embedded .exe icon is used;
// this drives the icon during `npm run dev`.
const APP_ICON = path.join(process.env.APP_ROOT, 'icon.ico');

let win: BrowserWindow | null = null;

// ---------------------------------------------------------------------------
// Steam integration
// ---------------------------------------------------------------------------

const STEAM_APP_ID = 3547880;
const CLOUD_SAVE_FILE = 'feebay-save.json';

// `steamworks.js` is a native module — required at runtime, never bundled.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let steamClient: any = null;

function initSteam(): void {
  try {
    const steamworks = require('steamworks.js');
    steamClient = steamworks.init(STEAM_APP_ID);
    // Route the Steam overlay through Electron's compositor.
    if (typeof steamworks.electronEnableSteamOverlay === 'function') {
      steamworks.electronEnableSteamOverlay();
    }
    console.log(`[steam] initialized for app ${STEAM_APP_ID}`);
  } catch (err) {
    steamClient = null;
    console.warn(
      '[steam] unavailable — the game will run without Steam features:',
      (err as Error)?.message,
    );
  }
}

type CloudSavePayload = { state: string; savedAt: number };

function readCloudSave(): CloudSavePayload | null {
  try {
    if (!steamClient?.cloud) return null;
    if (steamClient.cloud.fileExists && !steamClient.cloud.fileExists(CLOUD_SAVE_FILE)) {
      return null;
    }
    const raw = steamClient.cloud.readFile(CLOUD_SAVE_FILE);
    if (!raw) return null;
    const parsed = JSON.parse(String(raw));
    if (parsed && typeof parsed.state === 'string' && typeof parsed.savedAt === 'number') {
      return { state: parsed.state, savedAt: parsed.savedAt };
    }
    return null;
  } catch (err) {
    console.warn('[steam] cloud load failed:', (err as Error)?.message);
    return null;
  }
}

function writeCloudSave(payload: CloudSavePayload): void {
  try {
    if (!steamClient?.cloud?.writeFile) return;
    steamClient.cloud.writeFile(CLOUD_SAVE_FILE, JSON.stringify(payload));
  } catch (err) {
    console.warn('[steam] cloud save failed:', (err as Error)?.message);
  }
}

// Synchronous so the renderer's save loader can stay synchronous.
ipcMain.on('steam:available', (e) => {
  e.returnValue = !!steamClient;
});
ipcMain.on('steam:cloud-load', (e) => {
  e.returnValue = readCloudSave();
});
ipcMain.on('steam:cloud-save', (_e, payload: CloudSavePayload) => {
  if (payload && typeof payload.state === 'string') writeCloudSave(payload);
});

// Unlock a Steam achievement. The Steam API name must match the in-game id.
ipcMain.on('steam:unlock-achievement', (_e, apiName: unknown) => {
  try {
    if (steamClient?.achievement?.activate && typeof apiName === 'string') {
      steamClient.achievement.activate(apiName);
    }
  } catch (err) {
    console.warn('[steam] achievement unlock failed:', (err as Error)?.message);
  }
});

// ---------------------------------------------------------------------------

function createWindow() {
  win = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1100,
    minHeight: 720,
    title: 'FeeBay Simulator',
    icon: APP_ICON,
    backgroundColor: '#0b1220',
    autoHideMenuBar: true,
    frame: false, // custom title bar inside the renderer
    titleBarStyle: 'hidden',
    webPreferences: {
      preload: path.join(MAIN_DIST, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL);
  } else {
    win.loadFile(path.join(RENDERER_DIST, 'index.html'));
  }

  // Notify the renderer when maximize / fullscreen state changes, so the
  // title-bar icons update without polling.
  win.on('maximize', sendWindowState);
  win.on('unmaximize', sendWindowState);
  win.on('enter-full-screen', sendWindowState);
  win.on('leave-full-screen', sendWindowState);
}

function sendWindowState() {
  if (!win) return;
  win.webContents.send('window:state', {
    maximized: win.isMaximized(),
    fullscreen: win.isFullScreen(),
  });
}

// Window control IPC — called from the custom title bar.
ipcMain.on('window:minimize', (e) => {
  BrowserWindow.fromWebContents(e.sender)?.minimize();
});
ipcMain.on('window:maximize-toggle', (e) => {
  const w = BrowserWindow.fromWebContents(e.sender);
  if (!w) return;
  if (w.isMaximized()) w.unmaximize();
  else w.maximize();
});
ipcMain.on('window:close', (e) => {
  BrowserWindow.fromWebContents(e.sender)?.close();
});
ipcMain.on('window:fullscreen-toggle', (e) => {
  const w = BrowserWindow.fromWebContents(e.sender);
  if (w) w.setFullScreen(!w.isFullScreen());
});
ipcMain.handle('window:is-maximized', (e) => {
  return BrowserWindow.fromWebContents(e.sender)?.isMaximized() ?? false;
});
ipcMain.handle('window:is-fullscreen', (e) => {
  return BrowserWindow.fromWebContents(e.sender)?.isFullScreen() ?? false;
});

app.whenReady().then(() => {
  initSteam();
  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
  win = null;
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
