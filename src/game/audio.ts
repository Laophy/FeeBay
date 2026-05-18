import { useSyncExternalStore } from 'react';

/* Lightweight Web Audio synthesis. No asset pipeline. */

let ctx: AudioContext | null = null;
let muted = false;

// External-store plumbing so React components stay in sync when audio settings
// change from anywhere (sidebar toggle, dashboard settings, ...).
const audioListeners = new Set<() => void>();
function notifyAudio(): void {
  for (const l of audioListeners) l();
}
function subscribeAudio(listener: () => void): () => void {
  audioListeners.add(listener);
  return () => audioListeners.delete(listener);
}

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!ctx) {
    try {
      // @ts-expect-error - webkit prefix fallback
      const AC = window.AudioContext || window.webkitAudioContext;
      if (AC) ctx = new AC();
    } catch {
      return null;
    }
  }
  return ctx;
}

export function setMuted(value: boolean): void {
  muted = value;
  try {
    localStorage.setItem('feebay-muted', value ? '1' : '0');
  } catch {}
  notifyAudio();
}

export function isMuted(): boolean {
  try {
    const stored = localStorage.getItem('feebay-muted');
    if (stored !== null) muted = stored === '1';
  } catch {}
  return muted;
}

let volume = 1;
let volumeLoaded = false;

export function setVolume(value: number): void {
  volume = Math.max(0, Math.min(1, value));
  volumeLoaded = true;
  try {
    localStorage.setItem('feebay-volume', String(volume));
  } catch {}
  notifyAudio();
}

export function getVolume(): number {
  if (!volumeLoaded) {
    volumeLoaded = true;
    try {
      const stored = localStorage.getItem('feebay-volume');
      if (stored !== null) {
        const n = Number(stored);
        if (Number.isFinite(n)) volume = Math.max(0, Math.min(1, n));
      }
    } catch {}
  }
  return volume;
}

/** React hook — re-renders any component when the mute state changes anywhere. */
export function useMuted(): boolean {
  return useSyncExternalStore(subscribeAudio, isMuted);
}

/** React hook — re-renders any component when the volume changes anywhere. */
export function useVolume(): number {
  return useSyncExternalStore(subscribeAudio, getVolume);
}

function tone(opts: {
  freq: number;
  duration: number;
  type?: OscillatorType;
  gain?: number;
  freqEnd?: number;
  delay?: number;
}) {
  if (isMuted()) return;
  const vol = getVolume();
  if (vol < 0.01) return;
  const c = getCtx();
  if (!c) return;
  const now = c.currentTime + (opts.delay ?? 0);
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = opts.type ?? 'sine';
  osc.frequency.setValueAtTime(opts.freq, now);
  if (opts.freqEnd !== undefined) {
    osc.frequency.exponentialRampToValueAtTime(Math.max(40, opts.freqEnd), now + opts.duration);
  }
  const peak = (opts.gain ?? 0.12) * vol;
  g.gain.setValueAtTime(0.0001, now);
  g.gain.exponentialRampToValueAtTime(peak, now + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, now + opts.duration);
  osc.connect(g).connect(c.destination);
  osc.start(now);
  osc.stop(now + opts.duration + 0.05);
}

function noise(opts: { duration: number; gain?: number; delay?: number }) {
  if (isMuted()) return;
  const vol = getVolume();
  if (vol < 0.01) return;
  const c = getCtx();
  if (!c) return;
  const now = c.currentTime + (opts.delay ?? 0);
  const bufferSize = Math.floor(c.sampleRate * opts.duration);
  const buffer = c.createBuffer(1, bufferSize, c.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
  const src = c.createBufferSource();
  src.buffer = buffer;
  const g = c.createGain();
  g.gain.setValueAtTime((opts.gain ?? 0.1) * vol, now);
  g.gain.exponentialRampToValueAtTime(0.0001, now + opts.duration);
  src.connect(g).connect(c.destination);
  src.start(now);
  src.stop(now + opts.duration + 0.02);
}

export const SFX = {
  click() {
    tone({ freq: 540, duration: 0.06, type: 'square', gain: 0.05 });
  },
  buy() {
    tone({ freq: 380, duration: 0.08, type: 'triangle', gain: 0.08 });
    tone({ freq: 560, duration: 0.1, type: 'triangle', gain: 0.06, delay: 0.06 });
  },
  coin() {
    tone({ freq: 880, duration: 0.07, type: 'square', gain: 0.08 });
    tone({ freq: 1320, duration: 0.12, type: 'square', gain: 0.06, delay: 0.05 });
  },
  chaching() {
    tone({ freq: 880, duration: 0.08, type: 'triangle', gain: 0.09 });
    tone({ freq: 1175, duration: 0.1, type: 'triangle', gain: 0.07, delay: 0.06 });
    tone({ freq: 1480, duration: 0.16, type: 'triangle', gain: 0.07, delay: 0.14 });
  },
  loss() {
    tone({ freq: 320, duration: 0.18, type: 'sawtooth', gain: 0.07, freqEnd: 110 });
  },
  whoosh() {
    noise({ duration: 0.2, gain: 0.08 });
    tone({ freq: 220, duration: 0.18, type: 'sine', gain: 0.04, freqEnd: 700 });
  },
  slabCrack() {
    noise({ duration: 0.12, gain: 0.18 });
    tone({ freq: 200, duration: 0.18, type: 'sawtooth', gain: 0.06, freqEnd: 80, delay: 0.05 });
  },
  gradeReveal(grade: number) {
    if (grade >= 10) {
      tone({ freq: 660, duration: 0.12, type: 'triangle', gain: 0.1 });
      tone({ freq: 880, duration: 0.14, type: 'triangle', gain: 0.1, delay: 0.1 });
      tone({ freq: 1175, duration: 0.18, type: 'triangle', gain: 0.1, delay: 0.22 });
      tone({ freq: 1480, duration: 0.24, type: 'triangle', gain: 0.1, delay: 0.36 });
    } else if (grade >= 9) {
      tone({ freq: 660, duration: 0.12, type: 'triangle', gain: 0.09 });
      tone({ freq: 990, duration: 0.16, type: 'triangle', gain: 0.09, delay: 0.1 });
    } else if (grade >= 7) {
      tone({ freq: 520, duration: 0.18, type: 'sine', gain: 0.07 });
    } else if (grade > 0) {
      tone({ freq: 320, duration: 0.22, type: 'sawtooth', gain: 0.07, freqEnd: 180 });
    } else {
      tone({ freq: 220, duration: 0.4, type: 'sawtooth', gain: 0.1, freqEnd: 80 });
    }
  },
  marketEvent() {
    tone({ freq: 660, duration: 0.08, type: 'triangle', gain: 0.06 });
    tone({ freq: 990, duration: 0.1, type: 'triangle', gain: 0.05, delay: 0.06 });
  },
  achievement() {
    tone({ freq: 740, duration: 0.1, type: 'triangle', gain: 0.08 });
    tone({ freq: 988, duration: 0.12, type: 'triangle', gain: 0.08, delay: 0.08 });
    tone({ freq: 1318, duration: 0.16, type: 'triangle', gain: 0.08, delay: 0.18 });
  },
  cardFlip() {
    noise({ duration: 0.06, gain: 0.06 });
  },
};
