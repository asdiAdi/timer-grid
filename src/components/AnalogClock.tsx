import { progress } from '../lib/time';

export function AnalogClock({ remainingMs, initialMs, status }:{remainingMs:number; initialMs:number; status:string}) {
  const totalSec = Math.ceil(remainingMs/1000);
  const s = totalSec % 60;
  const m = Math.floor(totalSec/60) % 60;
  const h = Math.floor(totalSec/3600) %12;

  // angles: 0 at top
  const secAngle = s*6; // 360/60
  const minAngle = m*6 + s*0.1;
  const hourAngle = h*30 + m*0.5;

  const isAlert = status==='alerting';
  const size=160;
  const c=size/2;
  const r=size/2 -8;

  return (
    <div className="flex flex-col items-center py-4">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className={`${isAlert?'drop-shadow-[0_0_12px_rgba(239,68,68,0.7)]':''}`}>
        <circle cx={c} cy={c} r={r} fill="#18181b" stroke={isAlert?'#ef4444':'#3f3f46'} strokeWidth={2} />
        {/* ticks */}
        {Array.from({length:60}).map((_,i)=>{
          const ang = i*6 * Math.PI/180;
          const isHour = i%5===0;
          const inner = isHour ? r-10 : r-5;
          const x1 = c + Math.sin(ang)*inner;
          const y1 = c - Math.cos(ang)*inner;
          const x2 = c + Math.sin(ang)*r;
          const y2 = c - Math.cos(ang)*r;
          return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={isHour? '#a1a1aa':'#52525b'} strokeWidth={isHour?2:1} />;
        })}
        {/* progress arc background */}
        <circle cx={c} cy={c} r={r-18} fill="none" stroke="#27272a" strokeWidth={4} />
        <circle cx={c} cy={c} r={r-18} fill="none" stroke={isAlert?'#ef4444':'#8b5cf6'} strokeWidth={4} strokeLinecap="round"
          strokeDasharray={`${2*Math.PI*(r-18)}`}
          strokeDashoffset={`${2*Math.PI*(r-18)*(1-progress(initialMs, remainingMs))}`}
          transform={`rotate(-90 ${c} ${c})`} style={{transition:'stroke-dashoffset 0.1s linear'}} />
        {/* hands */}
        <line x1={c} y1={c} x2={c + Math.sin(hourAngle*Math.PI/180)*(r*0.45)} y2={c - Math.cos(hourAngle*Math.PI/180)*(r*0.45)} stroke="#f4f4f5" strokeWidth={4} strokeLinecap="round" />
        <line x1={c} y1={c} x2={c + Math.sin(minAngle*Math.PI/180)*(r*0.62)} y2={c - Math.cos(minAngle*Math.PI/180)*(r*0.62)} stroke="#e4e4e7" strokeWidth={3} strokeLinecap="round" />
        <line x1={c} y1={c} x2={c + Math.sin(secAngle*Math.PI/180)*(r*0.72)} y2={c - Math.cos(secAngle*Math.PI/180)*(r*0.72)} stroke={isAlert?'#ef4444':'#a78bfa'} strokeWidth={2} strokeLinecap="round" />
        <circle cx={c} cy={c} r={5} fill={isAlert?'#ef4444':'#8b5cf6'} stroke="#18181b" strokeWidth={2} />
      </svg>
      <div className="mt-2 font-mono text-sm tabular-nums text-zinc-400">
        {String(Math.floor(totalSec/3600)).padStart(2,'0')}:{String(m).padStart(2,'0')}:{String(s).padStart(2,'0')}
      </div>
    </div>
  );
}
