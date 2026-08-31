import { useCallback, useEffect, useRef, useState } from 'react';

// In-memory only, no localStorage. Generate distinct beeps via Web Audio.
// Users can upload mp3s which are stored as Object URLs in memory.
export function useAudio() {
  const [sounds, setSounds] = useState<string[]>([]); // object URLs
  const [enabled, setEnabled] = useState(false);
  const ctxRef = useRef<AudioContext | null>(null);

  const ensureCtx = useCallback(()=>{
    if (!ctxRef.current) {
      const Ctx = (window as any).AudioContext || (window as any).webkitAudioContext;
      if (Ctx) ctxRef.current = new Ctx();
    }
    if (ctxRef.current?.state === 'suspended') ctxRef.current.resume();
    setEnabled(true);
  },[]);

  // unlock on first user interaction
  useEffect(()=>{
    const h = ()=> ensureCtx();
    window.addEventListener('click', h, {once:true});
    window.addEventListener('keydown', h, {once:true});
    return ()=>{ window.removeEventListener('click',h); window.removeEventListener('keydown',h); };
  },[ensureCtx]);

  const addFiles = useCallback((files: FileList | File[])=>{
    const arr = Array.from(files);
    const urls = arr.filter(f=>f.type.startsWith('audio/') || f.name.endsWith('.mp3')).map(f=> URL.createObjectURL(f));
    if (urls.length) setSounds(prev=> [...prev, ...urls]);
  },[]);

  const play = useCallback((index:number)=>{
    ensureCtx();
    if (sounds[index % sounds.length]) {
      const a = new Audio(sounds[index % sounds.length]);
      a.volume = 0.9;
      a.play().catch(()=> beep(index));
      // auto-revoke? keep until page reload required (in-memory); don't revoke immediately.
      return;
    }
    beep(index);
  },[sounds, ensureCtx]);

  function beep(index:number){
    const ctx = ctxRef.current;
    if (!ctx) return;
    const baseFreq = 440 + (index % 7)*110; // distinct per timer
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = baseFreq;
    // add second harmonic for distinction
    osc.connect(gain);
    gain.connect(ctx.destination);
    gain.gain.setValueAtTime(0.0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.6, ctx.currentTime+0.02);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime+0.9);
    osc.start();
    // pattern: two beeps
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

  return { sounds, addFiles, play, enabled, ensureCtx, hasCustom: sounds.length>0 };
}
