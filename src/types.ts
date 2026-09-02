export type TimerStatus = 'idle' | 'running' | 'paused' | 'finished' | 'alerting';
export type VisualMode = 'digital' | 'analog';

export interface Timer {
  id: string;
  label: string;
  initialMs: number;
  remainingMs: number;
  status: TimerStatus;
  endAt: number | null;
  visual: VisualMode;
  soundIndex: number;
  alertingSince?: number;
}

export type TimerAction =
  | { type: 'ADD'; payload: { label: string; ms: number } }
  | { type: 'ADD_MANY'; payload: { label: string; ms: number }[] }
  | { type: 'PAUSE'; id: string }
  | { type: 'START'; id: string }
  | { type: 'STOP'; id: string }
  | { type: 'DELETE'; id: string }
  | { type: 'TOGGLE_VISUAL'; id: string }
  | { type: 'TICK'; now: number }
  | { type: 'PAUSE_ALL' }
  | { type: 'START_ALL' }
  | { type: 'CLEAR_FINISHED' }
  | { type: 'HYDRATE'; state: { timers: Timer[]; nextSound: number } };
