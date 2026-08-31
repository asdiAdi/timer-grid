import { formatMs, progress } from '../lib/time';

export function DigitalDisplay({ remainingMs, initialMs, status }:{remainingMs:number; initialMs:number; status:string}) {
  const pct = progress(initialMs, remainingMs);
  const isAlert = status==='alerting';
  return (
    <div className="relative flex flex-col items-center justify-center py-6">
      <div className={`font-mono text-4xl md:text-5xl font-bold tracking-wider tabular-nums ${isAlert?'text-red-400':'text-zinc-100'}`}>
        {formatMs(remainingMs)}
      </div>
      <div className="mt-3 w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
        <div className={`h-full transition-all duration-100 ${isAlert?'bg-red-500': status==='finished'?'bg-zinc-600':'bg-violet-500'}`} style={{width:`${pct*100}%`}} />
      </div>
      <div className="mt-1 text-xs text-zinc-500">{Math.round(pct*100)}% remaining</div>
    </div>
  );
}
