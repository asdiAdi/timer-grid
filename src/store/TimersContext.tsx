import React, { createContext, useContext, useReducer, useEffect, useRef, useCallback } from 'react';
import type { Timer, TimerAction } from '../types';
import { STORAGE_KEY, loadPersistedState, savePersistedState } from '../lib/persistence';

type State = { timers: Timer[]; nextSound: number };

const initialState: State = { timers: [], nextSound: 0 };

function getInitialState(): State {
  const loaded = loadPersistedState();
  return loaded ?? initialState;
}

function reducer(state: State, action: TimerAction): State {
  switch(action.type){
    case 'ADD': {
      const {label, ms} = action.payload;
      const id = crypto.randomUUID();
      const t: Timer = {
        id, label, initialMs: ms, remainingMs: ms,
        status: 'paused', endAt: null,
        visual: 'digital', soundIndex: state.nextSound,
      };
      return { timers: [...state.timers, t], nextSound: state.nextSound+1 };
    }
    case 'ADD_MANY': {
      let next = state.nextSound;
      const newTimers: Timer[] = action.payload.map(p=>{
        const id = crypto.randomUUID();
        const t: Timer = {
          id, label: p.label, initialMs: p.ms, remainingMs: p.ms,
          status:'paused', endAt: null,
          visual:'digital', soundIndex: next++,
        };
        return t;
      });
      return { timers:[...state.timers, ...newTimers], nextSound: next };
    }
    case 'PAUSE': {
      return { ...state, timers: state.timers.map(t=> t.id===action.id && t.status==='running' ? { ...t, status:'paused' as const, remainingMs: t.endAt ? Math.max(0, t.endAt - Date.now()) : t.remainingMs, endAt:null } : t ) };
    }
    case 'START': {
      return { ...state, timers: state.timers.map(t=> t.id===action.id && (t.status==='paused'||t.status==='idle') ? { ...t, status:'running' as const, endAt: Date.now()+t.remainingMs } : t ) };
    }
    case 'STOP': {
      return { ...state, timers: state.timers.map(t=> t.id===action.id ? { ...t, status:'paused' as const, remainingMs: t.initialMs, endAt:null } : t ) };
    }
    case 'DELETE': {
      return { ...state, timers: state.timers.filter(t=> t.id!==action.id) };
    }
    case 'TOGGLE_VISUAL': {
      return { ...state, timers: state.timers.map(t=> t.id===action.id ? {...t, visual: t.visual==='digital'?'analog':'digital'}:t) };
    }
    case 'PAUSE_ALL': {
      const now = Date.now();
      return { ...state, timers: state.timers.map(t=> t.status==='running' ? {...t, status:'paused' as const, remainingMs: t.endAt ? Math.max(0, t.endAt-now):t.remainingMs, endAt:null}:t) };
    }
    case 'START_ALL': {
      const now = Date.now();
      return { ...state, timers: state.timers.map(t=> t.status==='paused' ? {...t, status:'running' as const, endAt: now+t.remainingMs}:t) };
    }
    case 'CLEAR_FINISHED': {
      return { ...state, timers: state.timers.filter(t=> t.status!=='finished' && t.status!=='alerting') };
    }
    case 'HYDRATE': {
      return { timers: action.state.timers, nextSound: action.state.nextSound };
    }
    case 'TICK': {
      const now = action.now;
      let changed = false;
      const nextTimers = state.timers.map(t=>{
        if (t.status!=='running' || t.endAt===null) return t;
        const rem = Math.max(0, t.endAt - now);
        if (rem===0) {
          changed = true;
          return { ...t, remainingMs: 0, endAt: null, status:'alerting' as const, alertingSince: now };
        }
        if (rem !== t.remainingMs) {
          changed = true;
          return { ...t, remainingMs: rem };
        }
        return t;
      });
      if (!changed) return state;
      return { ...state, timers: nextTimers };
    }
    default: return state;
  }
}

type Ctx = State & {
  dispatch: React.Dispatch<TimerAction>;
  add: (label:string, ms:number)=>void;
  addMany: (items:{label:string; ms:number}[])=>void;
};

const TimersCtx = createContext<Ctx | null>(null);

export function TimersProvider({children}:{children:React.ReactNode}){
  const [state, dispatch] = useReducer(reducer, initialState, getInitialState);
  const add = useCallback((label:string, ms:number)=> dispatch({type:'ADD', payload:{label, ms}}), []);
  const addMany = useCallback((items:{label:string; ms:number}[])=> dispatch({type:'ADD_MANY', payload: items}), []);

  // tick loop
  const rafRef = useRef<number | null>(null);
  useEffect(()=>{
    const loop = ()=>{
      dispatch({type:'TICK', now: Date.now()});
      rafRef.current = window.setTimeout(loop as any, 100) as unknown as number;
    };
    const id = window.setTimeout(loop as any, 100);
    rafRef.current = id as unknown as number;
    return ()=> { if (rafRef.current) clearTimeout(rafRef.current); };
  },[]);

  // persistence: only on status-changing actions (not every TICK remainingMs drift)
  const prevRef = useRef<string>('');
  useEffect(()=>{
    const key = JSON.stringify(state.timers.map(t=>[t.id, t.status, t.endAt, t.initialMs, t.label, t.visual, t.soundIndex]));
    if (key === prevRef.current) return;
    prevRef.current = key;
    savePersistedState(state.timers, state.nextSound);
  }, [state.timers, state.nextSound]);

  // flush on page hide
  useEffect(()=>{
    const flush = ()=> savePersistedState(state.timers, state.nextSound);
    document.addEventListener('visibilitychange', flush);
    window.addEventListener('pagehide', flush);
    return ()=> { document.removeEventListener('visibilitychange', flush); window.removeEventListener('pagehide', flush); };
  }, [state.timers, state.nextSound]);

  // cross-tab sync (seamless, no reload)
  const stateRef = useRef(state);
  useEffect(()=>{ stateRef.current = state; }, [state]);
  useEffect(()=>{
    const onStorage = (e: StorageEvent)=>{
      if (e.key !== STORAGE_KEY) return;
      const loaded = loadPersistedState();
      const next = loaded ?? initialState;
      const cur = stateRef.current;
      if (JSON.stringify(next) !== JSON.stringify({ timers: cur.timers, nextSound: cur.nextSound })) {
        dispatch({ type: 'HYDRATE', state: next });
      }
    };
    window.addEventListener('storage', onStorage);
    return ()=> window.removeEventListener('storage', onStorage);
  }, []);

  return <TimersCtx.Provider value={{...state, dispatch, add, addMany}}>{children}</TimersCtx.Provider>;
}

export function useTimers(){
  const ctx = useContext(TimersCtx);
  if (!ctx) throw new Error('useTimers outside provider');
  return ctx;
}
