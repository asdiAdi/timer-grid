import { useState } from 'react';

type Field = 'h' | 'm' | 's';

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

/** Time shown as directly-editable segments (HH:)MM:SS — no popup, no extra chrome. */
export function TimeSegments({ remainingMs, initialMs, locked, label, onPause, onSetRemaining, inputClassName }:{
  remainingMs: number;
  initialMs: number;
  locked: boolean;
  label: string;
  onPause: ()=>void;
  onSetRemaining: (ms:number)=>void;
  inputClassName: string;
}) {
  const totalSec = Math.max(0, Math.ceil(remainingMs / 1000));
  const pH = Math.floor(totalSec / 3600);
  const pM = Math.floor(totalSec / 60) % 60;
  const pS = totalSec % 60;
  const showHours = initialMs >= 3600000 || pH > 0;

  const [draft, setDraft] = useState<{ h: string; m: string; s: string } | null>(null);
  const [focused, setFocused] = useState<Field | null>(null);

  const fromProps = { h: pad(pH), m: pad(pM), s: pad(pS) };
  // live tick flows through unless mid-edit (then frozen on the draft)
  const shown = focused === null ? fromProps : (draft ?? fromProps);

  if (locked) {
    return (
      <span className={inputClassName} aria-label={`${label} remaining`}>
        {showHours ? `${pad(pH)}:` : ''}{pad(pM)}:{pad(pS)}
      </span>
    );
  }

  const begin = (f: Field)=>{
    onPause();
    setDraft({ h: pad(pH), m: pad(pM), s: pad(pS) });
    setFocused(f);
  };

  const commit = ()=>{
    const d = draft;
    const f = focused;
    if (!d || !f) { setFocused(null); return; }
    // empty field = revert, no dispatch
    if (d.h === '' || d.m === '' || d.s === '') {
      setDraft(null);
      setFocused(null);
      return;
    }
    let h = showHours ? parseInt(d.h, 10) : 0;
    let m = parseInt(d.m, 10);
    let s = parseInt(d.s, 10);
    if (Number.isNaN(h) || Number.isNaN(m) || Number.isNaN(s)) {
      setDraft(null);
      setFocused(null);
      return;
    }
    // each segment independent: never carry into another segment.
    // out-of-range min/sec becomes 0, hours floor at 0.
    if (m > 59 || m < 0) m = 0;
    if (s > 59 || s < 0) s = 0;
    if (h < 0) h = 0;
    // if the total exceeds the timer length, zero only the field being
    // edited — the other two are never touched.
    let total = (h * 3600 + m * 60 + s) * 1000;
    if (total > initialMs) {
      if (f === 'h') h = 0; else if (f === 'm') m = 0; else s = 0;
      total = (h * 3600 + m * 60 + s) * 1000;
    }
    onSetRemaining(total);
    setDraft(null);
    setFocused(null);
  };

  const onChange = (f: Field, raw: string)=>{
    const digits = raw.replace(/\D/g, '').slice(0, f === 'h' ? 4 : 2);
    setDraft((prev)=>{
      const base = prev ?? { h: pad(pH), m: pad(pM), s: pad(pS) };
      return { ...base, [f]: digits };
    });
  };

  const seg = (f: Field, value: string, aria: string)=>(
    <input
      value={value}
      inputMode="numeric"
      autoComplete="off"
      spellCheck={false}
      maxLength={f === 'h' ? 4 : 2}
      size={Math.max(2, value.length)}
      aria-label={`${aria} for ${label}`}
      title="Click to edit"
      onFocus={(e)=> { begin(f); requestAnimationFrame(()=> e.target.select()); }}
      onChange={(e)=> onChange(f, e.target.value)}
      onBlur={()=> commit()}
      onKeyDown={(e)=>{
        if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
        if (e.key === 'Escape') { setDraft(null); setFocused(null); (e.target as HTMLInputElement).blur(); }
      }}
      style={{ width: `calc(${Math.max(2, value.length)}ch + 0.2em)` }}
      className={`${inputClassName} shrink-0 grow-0 border-0 m-0 p-0 bg-transparent text-center outline-none hover:bg-white/5 focus:bg-white/10 rounded`}
    />
  );

  return (
    <span className="inline-flex items-center justify-center whitespace-nowrap tabular-nums" onPointerDownCapture={onPause}>
      {showHours && (<>{seg('h', shown.h, 'Hours')}<span className={inputClassName}>:</span></>)}
      {seg('m', shown.m, 'Minutes')}
      <span className={inputClassName}>:</span>
      {seg('s', shown.s, 'Seconds')}
    </span>
  );
}
