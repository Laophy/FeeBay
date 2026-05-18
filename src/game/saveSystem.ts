import type { GameState } from '../types';

const SAVE_KEY = 'feebay-simulator-save-v9';
const SAVE_AT_KEY = 'feebay-simulator-saved-at';

function localTimestamp(): number {
  const raw = localStorage.getItem(SAVE_AT_KEY);
  const n = raw ? Number(raw) : 0;
  return Number.isFinite(n) ? n : 0;
}

export function saveGame(state: GameState): void {
  const json = JSON.stringify(state);
  const savedAt = Date.now();
  try {
    localStorage.setItem(SAVE_KEY, json);
    localStorage.setItem(SAVE_AT_KEY, String(savedAt));
  } catch (e) {
    console.error('save failed', e);
  }
  // Mirror to Steam Cloud (no-op when Steam isn't available).
  try {
    window.feebay?.steam?.cloudSave(json, savedAt);
  } catch (e) {
    console.warn('cloud save failed', e);
  }
}

export function loadGame(): GameState | null {
  let localRaw: string | null = null;
  try {
    localRaw = localStorage.getItem(SAVE_KEY);
  } catch (e) {
    console.error('load failed', e);
  }
  const localAt = localTimestamp();

  // Pull the Steam Cloud save and take whichever copy is newer. This restores
  // progress on a fresh machine and keeps multiple PCs in sync.
  try {
    const cloud = window.feebay?.steam?.cloudLoad?.();
    if (cloud && cloud.state && cloud.savedAt > localAt) {
      const cloudState = JSON.parse(cloud.state) as GameState;
      // Cache the cloud copy locally so subsequent saves build on it.
      try {
        localStorage.setItem(SAVE_KEY, cloud.state);
        localStorage.setItem(SAVE_AT_KEY, String(cloud.savedAt));
      } catch {
        /* localStorage write failed — still return the cloud state */
      }
      return cloudState;
    }
  } catch (e) {
    console.warn('cloud load failed', e);
  }

  if (!localRaw) return null;
  try {
    return JSON.parse(localRaw) as GameState;
  } catch (e) {
    console.error('load parse failed', e);
    return null;
  }
}

export function clearSave(): void {
  try {
    localStorage.removeItem(SAVE_KEY);
    localStorage.removeItem(SAVE_AT_KEY);
  } catch (e) {
    console.error('clear save failed', e);
  }
}

/** The current save as a JSON string, for the player to download as a backup. */
export function exportSave(): string | null {
  try {
    return localStorage.getItem(SAVE_KEY);
  } catch {
    return null;
  }
}

/**
 * Replace the local save with imported JSON. Returns false if it doesn't look
 * like a FeeBay save. The caller should reload the page on success.
 */
export function importSave(json: string): boolean {
  try {
    const parsed = JSON.parse(json) as Record<string, unknown>;
    if (
      typeof parsed !== 'object' ||
      parsed === null ||
      typeof parsed.cash !== 'number' ||
      typeof parsed.day !== 'number'
    ) {
      return false;
    }
    localStorage.setItem(SAVE_KEY, json);
    localStorage.setItem(SAVE_AT_KEY, String(Date.now()));
    return true;
  } catch {
    return false;
  }
}
