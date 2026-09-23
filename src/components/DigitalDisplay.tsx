import { progress } from '../lib/time';
import { TimeSegments } from './TimeSegments';

export function DigitalDisplay({ remainingMs, initialMs, status, label, locked, onPause, onSetRemaining }:{
  remainingMs: number;
  initialMs: number;
  status: string;
  label: string;
  locked: boolean;
  onPause: ()=>void;
  onSetRemaining: (ms:number)=>void;
}) {
  const pct = progress(initialMs, remainingMs);
  const isAlert = status==='alerting';

  return (
    <div className="relative flex flex-col items-center justify-center py-6">
      <div className={`font-mono text-4xl md:text-5xl font-bold tracking-wider ${isAlert?'text-red-400':'text-zinc-100'}`}>
        <TimeSegments
          remainingMs={remainingMs}
          initialMs={initialMs}
          locked={locked}
          label={label}
          onPause={onPause}
          onSetRemaining={onSetRemaining}
          inputClassName={`font-mono text-4xl md:text-5xl font-bold tracking-wider tabular-nums ${isAlert?'text-red-400':'text-zinc-100'}`}
        />
      </div>
      {/* existing progress bar — now directly draggable via invisible range overlay, same look */}
      <div className="relative mt-3 h-1.5 w-full">
        <div className="absolute inset-0 overflow-hidden rounded-full bg-zinc-800">
          <div className={`h-full transition-all duration-100 ${isAlert?'bg-red-500': status==='finished'?'bg-zinc-600':'bg-violet-500'}`} style={{width:`${pct*100}%`}} />
        </div>
        <input
          type="range"
          aria-label={`Scrub remaining for ${label}`}
          title={locked ? undefined : 'Drag to scrub remaining'}
          min={0}
          max={initialMs}
          step={1000}
          value={Math.max(0, Math.min(initialMs, Math.round(remainingMs)))}
          disabled={locked}
          onPointerDownCapture={onPause}
          onFocusCapture={onPause}
          onChange={(e)=> onSetRemaining(e.target.valueAsNumber)}
          className="absolute inset-0 h-full w-full cursor-ew-resize opacity-0 disabled:cursor-not-allowed"
        />
      </div>
      <div className="mt-1 text-xs text-zinc-500">{Math.round(pct*100)}% remaining</div>
    </div>
  );
}
