import type { Timer } from '../types';
import { formatHuman } from '../lib/time';
import { DigitalDisplay } from './DigitalDisplay';
import { AnalogClock } from './AnalogClock';

export function TimerCard({ timer, onPause, onStart, onStop, onDelete, onToggleVisual }:{
  timer: Timer;
  onPause:()=>void;
  onStart:()=>void;
  onStop:()=>void;
  onDelete:()=>void;
  onToggleVisual:()=>void;
}) {
  const isRunning = timer.status==='running';
  const isAlert = timer.status==='alerting';
  const isFinished = timer.status==='finished';

  return (
    <div className={`relative flex flex-col rounded-2xl border p-4 shadow-lg transition-all
      ${isAlert ? 'border-zinc-200 bg-white ring-2 ring-zinc-300' : isFinished ? 'border-zinc-700 bg-zinc-900 opacity-80' : 'border-zinc-800 bg-zinc-900 hover:border-zinc-700'}`}>
      {/* header */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className={`font-semibold truncate pr-2 ${isAlert ? 'text-zinc-900' : 'text-zinc-100'}`} title={timer.label}>{timer.label}</h3>
          <p className={`text-xs ${isAlert ? 'text-zinc-600' : 'text-zinc-500'}`}>initial {formatHuman(timer.initialMs)}</p>
        </div>
        <button onClick={onToggleVisual} title="Toggle clock/digital" className={`shrink-0 rounded-lg border px-2 py-1 text-xs ${isAlert ? 'border-zinc-300 bg-zinc-100 text-zinc-700 hover:bg-zinc-200' : 'border-zinc-700 bg-zinc-800 text-zinc-300 hover:bg-zinc-700'}`}>
          {timer.visual==='digital' ? '⏰ Clock' : '🔢 Digital'}
        </button>
      </div>

      {/* visual */}
      <div className="flex-1 flex flex-col justify-center">
        {timer.visual==='digital'
          ? <DigitalDisplay remainingMs={timer.remainingMs} initialMs={timer.initialMs} status={timer.status} />
          : <AnalogClock remainingMs={timer.remainingMs} initialMs={timer.initialMs} status={timer.status} />
        }
      </div>

      {isFinished && (
        <div className="mb-3 rounded-lg bg-zinc-800 border border-zinc-700 p-2 text-center text-sm text-zinc-400">Finished — press Stop to reset</div>
      )}

      {/* controls */}
      <div className="grid grid-cols-3 gap-2">
        {isRunning ? (
          <button onClick={onPause} className="rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-300 py-2 text-sm font-medium hover:bg-amber-500/30">Pause</button>
        ) : (
          <button onClick={onStart} disabled={isAlert||isFinished} className="rounded-xl bg-emerald-600 text-white py-2 text-sm font-medium hover:bg-emerald-700 disabled:opacity-30 disabled:cursor-not-allowed">Start</button>
        )}
        <button onClick={onStop} className="rounded-xl bg-zinc-800 border border-zinc-700 text-zinc-200 py-2 text-sm hover:bg-zinc-700">Stop</button>
        <button onClick={onDelete} className="rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 py-2 text-sm hover:bg-red-500/20">Delete</button>
      </div>
    </div>
  );
}
