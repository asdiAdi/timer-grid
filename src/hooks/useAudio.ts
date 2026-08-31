import { useCallback, useEffect, useRef, useState } from 'react';

export function useAudio() {
  const [enabled, setEnabled] = useState(false);
  const ctxRef = useRef<AudioContext | null>(null);

  const ensureCtx = useCallback(()=>{
    if (!ctxRef.current) {
      const Ctx = (window as unknown as { AudioContext: typeof AudioContext }).AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (Ctx) ctxRef.current = new Ctx();
    }
    if (ctxRef.current?.state === 'suspended') ctxRef.current.resume();
    setEnabled(true);
  },[]);

  useEffect(()=>{
    const h = ()=> ensureCtx();
    window.addEventListener('click', h, {once:true});
    window.addEventListener('keydown', h, {once:true});
    return ()=>{ window.removeEventListener('click',h); window.removeEventListener('keydown',h); };
  },[ensureCtx]);

  const play = useCallback((index:number)=>{
    ensureCtx();
    beep(index);
  },[ensureCtx]);

  function beep(index:number){
    const ctx = ctxRef.current;
    if (!ctx) return;
    const baseFreq = 440 + (index % 7)*110;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = baseFreq;
    osc.connect(gain);
    gain.connect(ctx.destination);
    gain.gain.setValueAtTime(0.0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.6, ctx.currentTime+0.02);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime+0.9);
    osc.start();
    osc.stop(ctx.currentTime+0.35);
    setTimeout(()=>{
      if (!ctxRef.current) return;
      const osc2 = ctxRef.current.createOscillator();
      const g2 = ctxRef.current.createGain();
      osc2.type='sine';
      osc2.frequency.value = baseFreq*1.2;
      osc2.connect(g2); g2.connect(ctxRef.current.destination);
      g2.gain.setValueAtTime(0, ctxRef.current.currentTime);
      g2.gain.linearRampToValueAtTime(0.6, ctxRef.current.currentTime+0.02);
      g2.gain.exponentialRampToValueAtTime(0.01, ctxRef.current.currentTime+0.5);
      osc2.start(); osc2.stop(ctxRef.current.currentTime+0.5);
    }, 450);
  }

  return { play, enabled, ensureCtx };
}
