import React, { createContext, useContext, useReducer, useEffect, useRef, useCallback } from 'react';
import type { Timer, TimerAction } from '../types';

type State = { timers: Timer[]; nextSound: number };

const initialState: State = { timers: [], nextSound: 0 };

function reducer(state: State, action: TimerAction): State {
  switch(action.type){
    case 'ADD': {
      const {label, ms, repeat} = action.payload;
      const id = crypto.randomUUID();
      const t: Timer = {
        id, label, initialMs: ms, remainingMs: ms,
        status: 'running', endAt: Date.now()+ms,
        visual: 'digital', soundIndex: state.nextSound,
        repeat: repeat ?? false,
      };
      return { timers: [...state.timers, t], nextSound: state.nextSound+1 };
    }
    case 'ADD_MANY': {
      let next = state.nextSound;
      const newTimers: Timer[] = action.payload.map(p=>{
        const id = crypto.randomUUID();
        const t: Timer = {
          id, label: p.label, initialMs: p.ms, remainingMs: p.ms,
          status:'running', endAt: Date.now()+p.ms,
          visual:'digital', soundIndex: next++,
          repeat: p.repeat ?? false,
        };
        return t;
      });
      return { timers:[...state.timers, ...newTimers], nextSound: next };
    }
    case 'PAUSE': {
      return { ...state, timers: state.timers.map(t=> t.id===action.id && t.status==='running' ? { ...t, status:'paused' as const, remainingMs: t.endAt ? Math.max(0, t.endAt - Date.now()) : t.remainingMs, endAt:null } : t ) };
    }
    case 'RESUME': {
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
    case 'SET_REPEAT': {
      return { ...state, timers: state.timers.map(t=> t.id===action.id ? {...t, repeat: action.repeat }:t) };
    }
    case 'REPEAT_NOW': {
      return { ...state, timers: state.timers.map(t=> t.id===action.id ? {...t, status:'running' as const, remainingMs: t.initialMs, endAt: Date.now()+t.initialMs, alertingSince: undefined }:t) };
    }
    case 'DISMISS': {
      return { ...state, timers: state.timers.map(t=> t.id===action.id && (t.status==='finished'||t.status==='alerting') ? {...t, status:'finished' as const}:t) };
    }
    case 'PAUSE_ALL': {
      const now = Date.now();
      return { ...state, timers: state.timers.map(t=> t.status==='running' ? {...t, status:'paused' as const, remainingMs: t.endAt ? Math.max(0, t.endAt-now):t.remainingMs, endAt:null}:t) };
    }
    case 'RESUME_ALL': {
      const now = Date.now();
      return { ...state, timers: state.timers.map(t=> t.status==='paused' ? {...t, status:'running' as const, endAt: now+t.remainingMs}:t) };
    }
    case 'CLEAR_FINISHED': {
      return { ...state, timers: state.timers.filter(t=> t.status!=='finished' && t.status!=='alerting') };
    }
    case 'TICK': {
      const now = action.now;
      let changed = false;
      const nextTimers = state.timers.map(t=>{
        if (t.status!=='running' || t.endAt===null) return t;
        const rem = Math.max(0, t.endAt - now);
        if (rem===0) {
          changed = true;
          // handle repeat
          if (t.repeat===true) {
            return { ...t, remainingMs: t.initialMs, endAt: now + t.initialMs, status:'running' as const, alertingSince: undefined };
            // we will also trigger a beep via side-effect; for infinite repeat we still beep but restart immediately
          }
          if (typeof t.repeat==='number' && t.repeat>0) {
            const left = t.repeat -1;
            if (left>0 || t.repeat===1) {
              // if more repeats left, restart
              // if left>0 after decrement, keep repeat count
              const shouldRestart = left>0 ? true : false;
              // For count repeats, after finishing we either restart or go to alert
              if (shouldRestart || t.repeat>1) {
                // actually if repeat=3 means total 3 runs: initial +2 repeats? simpler: repeat count = extra runs
                // We treat repeat number as remaining repeats after current
              }
            }
            // Implement: repeat=N means repeat N times after first? For UX: repeat 3 = total 3 cycles
            // Simpler: if repeat is number, decrement and restart until 1 left then finish
            // So if t.repeat = 3, first finish -> restart with 2, etc.
            if (typeof t.repeat==='number' && t.repeat>1) {
              return { ...t, remainingMs: t.initialMs, endAt: now + t.initialMs, status:'running' as const, repeat: t.repeat-1 };
            }
            if (typeof t.repeat==='number' && t.repeat===1) {
              return { ...t, remainingMs: t.initialMs, endAt: now + t.initialMs, status:'running' as const, repeat: false };
            }
          }
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
  const [state, dispatch] = useReducer(reducer, initialState);
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

  return <TimersCtx.Provider value={{...state, dispatch, add, addMany}}>{children}</TimersCtx.Provider>;
}

export function useTimers(){
  const ctx = useContext(TimersCtx);
  if (!ctx) throw new Error('useTimers outside provider');
  return ctx;
}
