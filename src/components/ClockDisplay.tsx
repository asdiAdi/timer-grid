import { useEffect, useState } from 'react';
import { formatWallClock } from '../lib/time';

function useNow(intervalMs = 1000): Date {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const delay = intervalMs - (Date.now() % intervalMs);
    let id: number | undefined;
    const timeout = window.setTimeout(() => {
      setNow(new Date());
      id = window.setInterval(() => setNow(new Date()), intervalMs);
    }, delay);
    return () => {
      window.clearTimeout(timeout);
      if (id !== undefined) window.clearInterval(id);
    };
  }, [intervalMs]);
  return now;
}

export function ClockDisplay() {
  const now = useNow(1000);
  const { time, date } = formatWallClock(now);
  return (
    <div
      className="flex items-baseline gap-2.5 rounded-xl bg-zinc-900 border border-zinc-800 px-4 py-2"
      title={now.toString()}
    >
      <span className="font-mono tabular-nums text-xl md:text-2xl font-bold tracking-wider text-zinc-100">{time}</span>
      <span className="hidden sm:inline font-mono tabular-nums text-sm text-zinc-500">{date}</span>
    </div>
  );
}
