import { useTimers } from '../store/TimersContext';
import { TimerCard } from './TimerCard';
import { useAudio } from '../hooks/useAudio';
import { useEffect, useRef } from 'react';

export function TimerGrid({ audio }:{audio: ReturnType<typeof useAudio>}) {
  const { timers, dispatch } = useTimers();
  const prevStatuses = useRef<Map<string,string>>(new Map());

  useEffect(()=>{
    timers.forEach(t=>{
      const prev = prevStatuses.current.get(t.id);
      if (prev !== 'alerting' && t.status==='alerting') {
        audio.play(t.soundIndex);
        // also vibrate if available
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
      <div className="flex flex-1 flex-col items-center justify-center py-16 text-center">
        <div className="text-5xl mb-4">⏱️</div>
        <h2 className="text-xl font-semibold text-zinc-200">No timers yet</h2>
        <p className="text-sm text-zinc-500 mt-2 max-w-md">Use the command bar below or the quick add form. Try: <code className="bg-zinc-800 px-1.5 py-0.5 rounded text-violet-300">add 5m eggs, 1m toast</code> or <code className="bg-zinc-800 px-1.5 py-0.5 rounded text-violet-300">add 01:30 pasta</code></p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-4 pb-32">
      {timers.map(t=>(
        <TimerCard key={t.id} timer={t}
          onPause={()=> dispatch({type:'PAUSE', id:t.id})}
          onResume={()=> dispatch({type:'RESUME', id:t.id})}
          onStop={()=> dispatch({type:'STOP', id:t.id})}
          onDelete={()=> dispatch({type:'DELETE', id:t.id})}
          onToggleVisual={()=> dispatch({type:'TOGGLE_VISUAL', id:t.id})}
          onRepeatToggle={()=>{
            if (t.repeat) dispatch({type:'SET_REPEAT', id:t.id, repeat:false});
            else dispatch({type:'SET_REPEAT', id:t.id, repeat:true});
          }}
          onDismiss={()=> dispatch({type:'DISMISS', id:t.id})}
        />
      ))}
    </div>
  );
}
