import type { Timer } from '../types';
import { DigitalDisplay } from './DigitalDisplay';
import { AnalogClock } from './AnalogClock';

export function TimerCard({ timer, onPause, onResume, onStop, onDelete, onToggleVisual, onRepeatToggle, onDismiss }:{
  timer: Timer;
  onPause:()=>void;
  onResume:()=>void;
  onStop:()=>void;
  onDelete:()=>void;
  onToggleVisual:()=>void;
  onRepeatToggle:()=>void;
  onDismiss:()=>void;
}) {
  const isRunning = timer.status==='running';
  const isAlert = timer.status==='alerting';
  const isFinished = timer.status==='finished';

  return (
    <div className={`relative flex flex-col rounded-2xl border p-4 bg-zinc-900 shadow-lg transition-all
      ${isAlert ? 'border-red-500 bg-red-950/30 animate-flash ring-2 ring-red-500/50' : isFinished ? 'border-zinc-700 opacity-80' : 'border-zinc-800 hover:border-zinc-700'}`}>
      {/* header */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="font-semibold text-zinc-100 truncate pr-2" title={timer.label}>{timer.label}</h3>
          <p className="text-xs text-zinc-500">initial {Math.ceil(timer.initialMs/1000)}s • sound #{timer.soundIndex+1} {timer.repeat ? `• repeat ${timer.repeat===true?'∞':timer.repeat}`:''}</p>
        </div>
        <button onClick={onToggleVisual} title="Toggle clock/digital" className="shrink-0 rounded-lg border border-zinc-700 bg-zinc-800 px-2 py-1 text-xs text-zinc-300 hover:bg-zinc-700">
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

      {/* alert dismiss */}
      {isAlert && (
        <div className="mb-3 rounded-lg bg-red-500/20 border border-red-500/40 p-2 flex items-center justify-between">
          <span className="text-sm font-medium text-red-300">⏰ Time's up!</span>
          <button onClick={onDismiss} className="text-xs bg-red-500 text-white px-3 py-1 rounded-full hover:bg-red-600">Dismiss</button>
        </div>
      )}
      {isFinished && (
        <div className="mb-3 rounded-lg bg-zinc-800 border border-zinc-700 p-2 text-center text-sm text-zinc-400">Finished — <button onClick={onRepeatToggle} className="underline">repeat</button> or stop to reset</div>
      )}

      {/* controls */}
      <div className="grid grid-cols-4 gap-2">
        {isRunning ? (
          <button onClick={onPause} className="rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-300 py-2 text-sm font-medium hover:bg-amber-500/30">Pause</button>
        ) : (
          <button onClick={onResume} disabled={isAlert||isFinished} className="rounded-xl bg-emerald-600 text-white py-2 text-sm font-medium hover:bg-emerald-700 disabled:opacity-30 disabled:cursor-not-allowed">Resume</button>
        )}
        <button onClick={onStop} className="rounded-xl bg-zinc-800 border border-zinc-700 text-zinc-200 py-2 text-sm hover:bg-zinc-700">Stop</button>
        <button onClick={onRepeatToggle} className={`rounded-xl border py-2 text-sm font-medium ${timer.repeat ? 'bg-violet-600 border-violet-500 text-white':'bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700'}`} title="Repeat toggles infinite loop">{timer.repeat ? 'Repeat✓' : 'Repeat'}</button>
        <button onClick={onDelete} className="rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 py-2 text-sm hover:bg-red-500/20">Delete</button>
      </div>
    </div>
  );
}
