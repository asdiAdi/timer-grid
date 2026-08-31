import { useTimers } from '../store/TimersContext';
import { TimerCard } from './TimerCard';
import { useEffect, useRef } from 'react';
import { useAudio } from '../hooks/useAudio';

export function TimerGrid({ audio }:{audio: ReturnType<typeof useAudio>}) {
  const { timers, dispatch } = useTimers();
  const prevStatuses = useRef<Map<string,string>>(new Map());

  useEffect(()=>{
    timers.forEach(t=>{
      const prev = prevStatuses.current.get(t.id);
      if (prev !== 'alerting' && t.status==='alerting') {
        audio.play(t.soundIndex);
        if (navigator.vibrate) navigator.vibrate([200,100,200]);
      }
      prevStatuses.current.set(t.id, t.status);
    });
    // cleanup deleted
    const ids = new Set(timers.map(t=>t.id));
    for (const k of prevStatuses.current.keys()) if (!ids.has(k)) prevStatuses.current.delete(k);
  }, [timers, audio]);

  if (timers.length===0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center py-16 px-4">
        <div className="text-5xl mb-4">⏱️</div>
        <h2 className="text-xl font-semibold text-zinc-200">No timers yet</h2>
        <p className="text-sm text-zinc-500 mt-1">Get started — try a command below</p>

        <div className="mt-6 w-full max-w-2xl text-left bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
          <div className="px-5 py-3.5 border-b border-zinc-800 flex items-center justify-between bg-zinc-900">
            <h3 className="text-xs font-semibold tracking-widest uppercase text-zinc-400">Commands</h3>
            <span className="text-[11px] font-mono text-zinc-500">separate with <span className="text-zinc-400">;</span> • type <span className="text-violet-400">help</span> to toggle</span>
          </div>

          <div className="p-5 space-y-2.5">
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <code className="bg-zinc-800 border border-zinc-700/60 rounded-lg px-2.5 py-1 text-xs font-mono text-violet-300">add 5m eggs</code>
              <span className="text-zinc-500 text-xs">— add timer</span>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <code className="bg-zinc-800 border border-zinc-700/60 rounded-lg px-2.5 py-1 text-xs font-mono text-violet-300">add 25m focus, 5m break</code>
              <span className="text-zinc-500 text-xs">— multiple timers (comma, ; or space separated)</span>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <code className="bg-zinc-800 border border-zinc-700/60 rounded-lg px-2.5 py-1 text-xs font-mono text-violet-300">add 1h30m roast</code>
              <span className="text-zinc-500 text-xs">/</span>
              <code className="bg-zinc-800 border border-zinc-700/60 rounded-lg px-2.5 py-1 text-xs font-mono text-violet-300">add 05:00 pasta</code>
              <span className="text-zinc-500 text-xs">/</span>
              <code className="bg-zinc-800 border border-zinc-700/60 rounded-lg px-2.5 py-1 text-xs font-mono text-violet-300">add 90s tea</code>
            </div>

            <div className="my-3 h-px bg-zinc-800" />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div className="flex items-center justify-between bg-zinc-800/50 border border-zinc-800 rounded-xl px-3 py-2">
                <code className="text-xs font-mono text-zinc-200">pause &lt;label|all&gt;</code>
                <span className="text-[11px] text-zinc-500">pause</span>
              </div>
              <div className="flex items-center justify-between bg-zinc-800/50 border border-zinc-800 rounded-xl px-3 py-2">
                <code className="text-xs font-mono text-zinc-200">start &lt;label|all&gt;</code>
                <span className="text-[11px] text-zinc-500">start</span>
              </div>
              <div className="flex items-center justify-between bg-zinc-800/50 border border-zinc-800 rounded-xl px-3 py-2">
                <code className="text-xs font-mono text-zinc-200">stop &lt;label|all&gt;</code>
                <span className="text-[11px] text-zinc-500">reset</span>
              </div>
              <div className="flex items-center justify-between bg-zinc-800/50 border border-zinc-800 rounded-xl px-3 py-2">
                <code className="text-xs font-mono text-zinc-200">delete &lt;label|all&gt;</code>
                <span className="text-[11px] text-zinc-500">remove</span>
              </div>

              <div className="flex items-center justify-between bg-zinc-800/50 border border-zinc-800 rounded-xl px-3 py-2">
                <code className="text-xs font-mono text-zinc-200">toggle &lt;label|all&gt;</code>
                <span className="text-[11px] text-zinc-500">clock ↔ digital</span>
              </div>
              <div className="flex items-center justify-between bg-zinc-800/50 border border-zinc-800 rounded-xl px-3 py-2">
                <code className="text-xs font-mono text-zinc-200">clear</code>
                <span className="text-[11px] text-zinc-500">/ clear finished</span>
              </div>
              <div className="flex items-center justify-between bg-zinc-800/30 border border-dashed border-zinc-700 rounded-xl px-3 py-2">
                <code className="text-xs font-mono text-zinc-400">help</code>
                <span className="text-[11px] text-zinc-500">show this</span>
              </div>
            </div>
          </div>

          <div className="px-5 py-3 bg-zinc-950/50 border-t border-zinc-800 flex gap-2 items-start">
            <span className="text-amber-400 text-xs mt-px">💡</span>
            <p className="text-xs leading-relaxed text-zinc-500">
              <span className="text-zinc-400 font-medium">Tips:</span> durations support <span className="text-zinc-300 font-mono">1h 30m 15s</span>, <span className="text-zinc-300 font-mono">90s</span>, <span className="text-zinc-300 font-mono">5m</span>, <span className="text-zinc-300 font-mono">01:30:00</span>. Separate commands with <span className="text-zinc-300 font-mono">;</span>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-4 pb-32">
      {timers.map(t=>(
        <TimerCard key={t.id} timer={t}
          onPause={()=> dispatch({type:'PAUSE', id:t.id})}
          onStart={()=> dispatch({type:'START', id:t.id})}
          onStop={()=> dispatch({type:'STOP', id:t.id})}
          onDelete={()=> dispatch({type:'DELETE', id:t.id})}
          onToggleVisual={()=> dispatch({type:'TOGGLE_VISUAL', id:t.id})}
        />
      ))}
    </div>
  );
}
