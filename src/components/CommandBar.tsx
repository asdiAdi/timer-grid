import { useState, useRef } from 'react';
import { useTimers } from '../store/TimersContext';
import { helpText, parseCommandLine } from '../lib/parser';
import { parseDuration } from '../lib/time';

export function CommandBar(){
  const { dispatch } = useTimers();
  const [input, setInput] = useState('');
  const [log, setLog] = useState<{type:'info'|'error'|'success', text:string}[]>([
    {type:'info', text:'Welcome — type "help" for commands. E.g. "add 5m eggs; add 1h roast" or "add 25m focus, 5m break"'}
  ]);
  const [showHelp, setShowHelp] = useState(false);
  const historyRef = useRef<string[]>([]);
  const histIdxRef = useRef(-1);

  const pushLog = (type:'info'|'error'|'success', text:string)=> setLog(l=> [...l.slice(-20), {type, text}]);

  const execute = (raw:string)=>{
    if (!raw.trim()) return;
    historyRef.current.push(raw);
    histIdxRef.current = historyRef.current.length;
    const cmds = parseCommandLine(raw);
    let added = 0;
    for (const c of cmds) {
      switch(c.kind){
        case 'add': {
          dispatch({type:'ADD_MANY', payload: c.timers.map(t=>({label:t.label, ms:t.ms}))});
          added += c.timers.length;
          pushLog('success', `Added ${c.timers.length} timer(s): ${c.timers.map(t=>`${t.label} (${Math.ceil(t.ms/1000)}s)`).join(', ')}`);
          break;
        }
        case 'pause': {
          if (c.target.toLowerCase()==='all') { dispatch({type:'PAUSE_ALL'}); pushLog('success','Paused all'); }
          else { const t = findByLabel(c.target); if (t) { dispatch({type:'PAUSE', id:t.id}); pushLog('success',`Paused ${t.label}`);} else pushLog('error',`No timer found: ${c.target}`); }
          break;
        }
        case 'resume': {
          if (c.target.toLowerCase()==='all') { dispatch({type:'RESUME_ALL'}); pushLog('success','Resumed all'); }
          else { const t = findByLabel(c.target); if (t) { dispatch({type:'RESUME', id:t.id}); pushLog('success',`Resumed ${t.label}`);} else pushLog('error',`No timer: ${c.target}`); }
          break;
        }
        case 'stop': {
          if (c.target.toLowerCase()==='all') { // stop all = pause and reset all
            // dispatch stop per timer
            // we need timers list
            getTimers().forEach(t=> dispatch({type:'STOP', id:t.id}));
            pushLog('success','Stopped all (reset)');
          } else { const t=findByLabel(c.target); if(t){dispatch({type:'STOP', id:t.id}); pushLog('success',`Stopped ${t.label} (reset)`);} else pushLog('error',`No timer: ${c.target}`);}
          break;
        }
        case 'delete': {
          if (c.target.toLowerCase()==='all') { getTimers().forEach(t=> dispatch({type:'DELETE', id:t.id})); pushLog('success','Deleted all'); }
          else { const t=findByLabel(c.target); if(t){dispatch({type:'DELETE', id:t.id}); pushLog('success',`Deleted ${t.label}`);} else pushLog('error',`No timer: ${c.target}`);}
          break;
        }
        case 'repeat': {
          const t=findByLabel(c.target);
          if (!t) { pushLog('error',`No timer: ${c.target}`); break; }
          if (c.count==='off') { dispatch({type:'SET_REPEAT', id:t.id, repeat:false}); pushLog('success',`Repeat off for ${t.label}`); }
          else if (c.count==='infinite') { dispatch({type:'SET_REPEAT', id:t.id, repeat:true}); pushLog('success',`Repeat infinite for ${t.label}`); }
          else if (typeof c.count==='number') { dispatch({type:'SET_REPEAT', id:t.id, repeat:c.count}); pushLog('success',`Repeat ${c.count}× for ${t.label}`); }
          else { dispatch({type:'SET_REPEAT', id:t.id, repeat: !t.repeat}); pushLog('success',`Toggled repeat for ${t.label}`); }
          break;
        }
        case 'toggle': {
          if (c.target.toLowerCase()==='all') { getTimers().forEach(t=> dispatch({type:'TOGGLE_VISUAL', id:t.id})); pushLog('success','Toggled all visuals'); }
          else { const t=findByLabel(c.target); if(t){dispatch({type:'TOGGLE_VISUAL', id:t.id}); pushLog('success',`Toggled ${t.label}`);} else pushLog('error',`No timer: ${c.target}`);}
          break;
        }
        case 'clear': { dispatch({type:'CLEAR_FINISHED'}); pushLog('success','Cleared finished'); break; }
        case 'help': { setShowHelp(v=>!v); break; }
        case 'unknown': { pushLog('error', c.error); break; }
      }
    }
    if (added===0 && cmds.some(c=>c.kind==='unknown')) {/* already logged */}
  };

  // helpers to find timers — need to read from context without re-render issues
  // Use a trick: dispatch reader via closure reading latest timers from DOM? Simpler: import useTimers in component and use it.
  // We'll call useTimers directly:
  const timersState = useTimers();
  const findByLabel = (label:string)=>{
    const lower = label.toLowerCase();
    return timersState.timers.find(t=> t.label.toLowerCase()===lower) || timersState.timers.find(t=> t.label.toLowerCase().includes(lower)) || null;
  };
  const getTimers = ()=> timersState.timers;

  const onKeyDown = (e:React.KeyboardEvent<HTMLInputElement>)=>{
    if (e.key==='Enter') { execute(input); setInput(''); }
    if (e.key==='ArrowUp') {
      e.preventDefault();
      if (historyRef.current.length===0) return;
      histIdxRef.current = Math.max(0, histIdxRef.current-1);
      setInput(historyRef.current[histIdxRef.current]||'');
    }
    if (e.key==='ArrowDown') {
      e.preventDefault();
      if (histIdxRef.current >= historyRef.current.length-1) { histIdxRef.current = historyRef.current.length; setInput(''); }
      else { histIdxRef.current++; setInput(historyRef.current[histIdxRef.current]||''); }
    }
  };

  return (
    <div className="fixed bottom-0 inset-x-0 border-t border-zinc-800 bg-zinc-950/95 backdrop-blur supports-[backdrop-filter]:bg-zinc-950/80">
      {/* log */}
      <div className="max-h-28 overflow-auto px-4 py-2 space-y-1 text-xs font-mono">
        {log.slice(-4).map((l,i)=>(
          <div key={i} className={`${l.type==='error'?'text-red-400': l.type==='success'?'text-emerald-400':'text-zinc-500'}`}>{l.text}</div>
        ))}
        {showHelp && <pre className="whitespace-pre-wrap text-zinc-300 bg-zinc-900 border border-zinc-800 rounded p-2 mt-2">{helpText()}</pre>}
      </div>
      <div className="flex items-center gap-2 px-3 py-3 border-t border-zinc-900">
        <span className="text-violet-400 font-mono text-sm select-none">›</span>
        <input
          value={input}
          onChange={e=>setInput(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder='Type command: "add 5m eggs, 2m toast" or "pause all" — Enter to run, help for list'
          className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500"
        />
        <button onClick={()=>{execute(input); setInput('');}} className="shrink-0 rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-violet-700">Send</button>
        <button onClick={()=>setShowHelp(v=>!v)} title="Help" className="shrink-0 rounded-xl bg-zinc-800 border border-zinc-700 px-3 py-2.5 text-sm text-zinc-300 hover:bg-zinc-700">?</button>
      </div>
      <QuickAddInline />
    </div>
  );
}

function QuickAddInline(){
  const { dispatch } = useTimers();
  const [label,setLabel]=useState('');
  const [dur,setDur]=useState('5m');
  const add = ()=>{
    const ms = parseDuration(dur);
    if (!ms || ms<=0) return alert('Invalid duration. Try 5m, 90s, 1h, 01:30');
    const finalLabel = label.trim() || `Timer ${Date.now()%1000}`;
    dispatch({type:'ADD', payload:{label: finalLabel, ms}});
    setLabel('');
  };
  return (
    <div className="hidden md:flex items-center gap-2 px-3 pb-3">
      <span className="text-xs text-zinc-500">Quick add:</span>
      <input value={dur} onChange={e=>setDur(e.target.value)} placeholder="5m" className="w-24 bg-zinc-900 border border-zinc-800 rounded-lg px-2 py-1.5 text-xs text-zinc-100" />
      <input value={label} onChange={e=>setLabel(e.target.value)} placeholder="label" className="w-32 bg-zinc-900 border border-zinc-800 rounded-lg px-2 py-1.5 text-xs text-zinc-100" />
      <button onClick={add} className="rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-1.5 text-xs text-zinc-200 hover:bg-zinc-700">Add</button>
      <span className="text-[11px] text-zinc-600 ml-2">Supports 1h30m, 90s, 05:00</span>
    </div>
  );
}
