import type { Timer } from '../types';

export const STORAGE_KEY = 'web_timer:state:v1';

export type PersistedState = {
  version: 1;
  savedAt: number;
  timers: Timer[];
  nextSound: number;
};

export function loadPersistedState(): { timers: Timer[]; nextSound: number } | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PersistedState;
    if (parsed.version !== 1 || !Array.isArray(parsed.timers)) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    const now = Date.now();
    const timers: Timer[] = parsed.timers.map((t) => {
      if (t.status === 'running' && t.endAt !== null) {
        const rem = Math.max(0, t.endAt - now);
        if (rem === 0) return { ...t, remainingMs: 0, endAt: null, status: 'alerting' as const, alertingSince: now };
        return { ...t, remainingMs: rem };
      }
      return t;
    });
    return { timers, nextSound: parsed.nextSound ?? timers.length };
  } catch {
    try { localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
    return null;
  }
}

export function savePersistedState(timers: Timer[], nextSound: number): void {
  try {
    if (timers.length === 0) {
      localStorage.removeItem(STORAGE_KEY);
      return;
    }
    const data: PersistedState = { version: 1, savedAt: Date.now(), timers, nextSound };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch { /* quota or private mode — ignore */ }
}

export function clearPersistedState(): void {
  try { localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
}
