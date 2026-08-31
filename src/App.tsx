import { TimersProvider, useTimers } from './store/TimersContext';
import { TimerGrid } from './components/TimerGrid';
import { CommandBar } from './components/CommandBar';
import { useAudio } from './hooks/useAudio';
import { useRef } from 'react';

function Header({audio}:{audio: ReturnType<typeof useAudio>}){
  const { timers, dispatch } = useTimers();
  const fileRef = useRef<HTMLInputElement>(null);
  const running = timers.filter(t=>t.status==='running').length;
  return (
    <header className="sticky top-0 z-20 border-b border-zinc-800 bg-zinc-950/90 backdrop-blur">
      <div className="mx-auto max-w-7xl px-4 py-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-violet-600 grid place-items-center font-bold">⏱️</div>
          <div>
            <h1 className="text-lg font-semibold leading-none text-zinc-100">Timer Grid</h1>
            <p className="text-xs text-zinc-500">{timers.length} timers • {running} running • in-memory only</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button onClick={()=>dispatch({type:'PAUSE_ALL'})} className="rounded-xl bg-zinc-800 border border-zinc-700 px-3 py-1.5 text-xs text-zinc-200 hover:bg-zinc-700">Pause All</button>
          <button onClick={()=>dispatch({type:'RESUME_ALL'})} className="rounded-xl bg-zinc-800 border border-zinc-700 px-3 py-1.5 text-xs text-zinc-200 hover:bg-zinc-700">Resume All</button>
          <button onClick={()=>dispatch({type:'CLEAR_FINISHED'})} className="rounded-xl bg-zinc-800 border border-zinc-700 px-3 py-1.5 text-xs text-zinc-200 hover:bg-zinc-700">Clear Finished</button>
          <div className="h-6 w-px bg-zinc-800 mx-1" />
          <input ref={fileRef} type="file" accept="audio/*,.mp3" multiple className="hidden" onChange={e=> e.target.files && audio.addFiles(e.target.files)} />
          <button onClick={()=>fileRef.current?.click()} className="rounded-xl bg-violet-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-violet-700" title="Upload mp3s — each timer gets distinct sound (in-memory only)">
            {audio.hasCustom ? `Sounds ✓ (${audio.sounds.length})` : 'Upload mp3s'}
          </button>
          {!audio.enabled && <span className="text-[11px] text-amber-400">Click anywhere to enable audio</span>}
        </div>
      </div>
    </header>
  );
}

function AppInner(){
  const audio = useAudio();
  return (
    <div className="min-h-screen flex flex-col bg-zinc-950">
      <Header audio={audio} />
      <main className="flex-1 mx-auto w-full max-w-7xl">
        <TimerGrid audio={audio} />
      </main>
      <CommandBar />
    </div>
  );
}

export default function App(){
  return <TimersProvider><AppInner /></TimersProvider>;
}
