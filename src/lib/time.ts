export function formatMs(ms: number): string {
  const totalSec = Math.max(0, Math.ceil(ms / 1000));
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
  return `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
}

export function parseDuration(input: string): number | null {
  const s = input.trim().toLowerCase();
  if (!s) return null;
  // colon forms: hh:mm:ss or mm:ss or h:mm:ss
  if (s.includes(':')) {
    const parts = s.split(':').map(p=>p.trim());
    if (parts.some(p=>p===''||isNaN(Number(p)))) return null;
    const nums = parts.map(Number);
    if (nums.length===3) {
      const [h,m,sec]=nums;
      if (m>=60||sec>=60) return null;
      return (h*3600+m*60+sec)*1000;
    }
    if (nums.length===2) {
      const [m,sec]=nums;
      if (sec>=60) return null;
      return (m*60+sec)*1000;
    }
    return null;
  }
  // h m s forms: 1h30m, 90s, 2h, 5m, 1h 30m 15s
  const regex = /(\d+(?:\.\d+)?)\s*(h|hr|hrs|hour|hours|m|min|mins|minute|minutes|s|sec|secs|second|seconds)/gi;
  let total = 0;
  let matched = false;
  let mm: RegExpExecArray | null;
  while ((mm = regex.exec(s)) !== null) {
    matched = true;
    const val = parseFloat(mm[1]);
    const unit = mm[2].toLowerCase();
    if (unit.startsWith('h')) total += val*3600000;
    else if (unit.startsWith('m')) total += val*60000;
    else if (unit.startsWith('s')) total += val*1000;
  }
  if (matched) return Math.round(total);
  // bare number: treat as seconds if < 1000 else ms? convention: 90 => 90s, 90s implicit
  // also support "90" => 90 seconds, "300" => 5m
  if (/^\d+(\.\d+)?$/.test(s)) {
    const v = parseFloat(s);
    // if user types "90" assume seconds
    return v*1000;
  }
  return null;
}

export function progress(initial: number, remaining: number): number {
  if (initial <=0) return 0;
  return Math.max(0, Math.min(1, remaining/initial));
}
