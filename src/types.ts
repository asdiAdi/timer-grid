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
  repeat: boolean | number; // false, true (=infinite), or count remaining repeats
  repeatCountOriginal?: number;
  alertingSince?: number;
}

export type TimerAction =
  | { type: 'ADD'; payload: { label: string; ms: number; repeat?: boolean | number } }
  | { type: 'ADD_MANY'; payload: { label: string; ms: number; repeat?: boolean | number }[] }
  | { type: 'PAUSE'; id: string }
  | { type: 'RESUME'; id: string }
  | { type: 'STOP'; id: string }
  | { type: 'DELETE'; id: string }
  | { type: 'TOGGLE_VISUAL'; id: string }
  | { type: 'SET_REPEAT'; id: string; repeat: boolean | number }
  | { type: 'TICK'; now: number }
  | { type: 'DISMISS'; id: string }
  | { type: 'PAUSE_ALL' }
  | { type: 'RESUME_ALL' }
  | { type: 'CLEAR_FINISHED' }
  | { type: 'REPEAT_NOW'; id: string };
