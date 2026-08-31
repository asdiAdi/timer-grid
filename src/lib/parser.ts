import { parseDuration } from './time';

export type ParsedCommand =
  | { kind:'add'; timers:{label:string; ms:number}[]; raw:string }
  | { kind:'pause'; target:string }
  | { kind:'resume'; target:string }
  | { kind:'stop'; target:string }
  | { kind:'delete'; target:string }
  | { kind:'repeat'; target:string; count?: number|'infinite'|'off' }
  | { kind:'toggle'; target:string }
  | { kind:'clear' }
  | { kind:'help' }
  | { kind:'unknown'; raw:string; error:string };

let autoCounter = 1;

export function parseCommandLine(input: string): ParsedCommand[] {
  if (!input.trim()) return [];
  const lower = input.trim();
  // help / clear quick paths
  if (/^help$|^h$|^\?$/.test(lower.toLowerCase())) return [{kind:'help'}];
  if (/^clear(\s+finished)?$/i.test(lower)) return [{kind:'clear'}];

  // split by ; or newline first, then also handle comma/and for add commands?
  // We keep ';' and newline as command separators. Comma is used inside add for multiple timers.
  const segments = lower.split(/[;\n]+/).map(s=>s.trim()).filter(Boolean);
  const out: ParsedCommand[] = [];
  for (const seg of segments) {
    const cmd = parseSingle(seg);
    if (Array.isArray(cmd)) out.push(...cmd);
    else out.push(cmd);
  }
  return out;
}

function parseSingle(seg: string): ParsedCommand | ParsedCommand[] {
  const m = seg.match(/^(add|pause|resume|stop|delete|remove|repeat|toggle|clock|clear|help)\b\s*(.*)$/i);
  if (!m) {
    // try implicit add: if segment starts with duration like "5m eggs"
    const dur = parseDuration(seg.split(/\s+/)[0]);
    if (dur !== null) {
      // treat whole seg as add
      return parseAdd(seg);
    }
    return { kind:'unknown', raw:seg, error:`Unknown command: "${seg}". Try "help"` };
  }
  const verb = m[1].toLowerCase();
  const rest = (m[2]||'').trim();
  switch(verb) {
    case 'add': return parseAdd(rest);
    case 'pause': return {kind:'pause', target: rest||'all'};
    case 'resume': return {kind:'resume', target: rest||'all'};
    case 'stop': return {kind:'stop', target: rest||'all'};
    case 'delete':
    case 'remove': return {kind:'delete', target: rest||'all'};
    case 'repeat': {
      // repeat <label> [3|infinite|off|x3]
      const parts = rest.split(/\s+/).filter(Boolean);
      if (!parts.length) return {kind:'unknown', raw:seg, error:'repeat needs a label, e.g. "repeat eggs" or "repeat eggs 3"'};
      const label = parts[0];
      const cntRaw = parts[1]?.toLowerCase();
      let count: number|'infinite'|'off'|undefined;
      if (!cntRaw) count = 'infinite';
      else if (cntRaw==='off'||cntRaw==='stop'||cntRaw==='0') count='off';
      else if (cntRaw==='infinite'||cntRaw==='inf'||cntRaw==='loop') count='infinite';
      else if (/^x?\d+$/.test(cntRaw)) count = parseInt(cntRaw.replace('x',''),10);
      else count='infinite';
      return {kind:'repeat', target:label, count} as ParsedCommand;
    }
    case 'toggle':
    case 'clock': return {kind:'toggle', target: rest||'all'};
    case 'clear': return {kind:'clear'};
    case 'help': return {kind:'help'};
    default: return {kind:'unknown', raw:seg, error:'Unknown verb'};
  }
}

function parseAdd(rest: string): ParsedCommand {
  // rest may be like "5m eggs, 10m pasta, 1h roast" or '5m "my eggs" 10m pasta'
  // Strategy: tokenise by finding durations sequentially.
  // We scan with regex for durations, then label is text until next duration or end/comma.
  if (!rest.trim()) return {kind:'unknown', raw:rest, error:'add needs a duration, e.g. "add 5m eggs"'};
  const timers: {label:string; ms:number}[] = [];
  // split by comma first for multi
  const commaParts = rest.split(',').map(s=>s.trim()).filter(Boolean);
  // if commaParts >1, each part should contain one duration+label; but if no comma but "add 25m focus 5m break" -> need to handle space-separated multi
  const parts = commaParts.length>1 ? commaParts : [rest];

  for (const part of parts) {
    // part may contain multiple timers like "25m focus 5m break"
    // Find all duration occurrences with their indices
    const durRegex = /(\d+:\d+:\d+|\d+:\d+|\d+(?:\.\d+)?\s*(?:h|hr|hrs|hour|hours|m|min|mins|minute|minutes|s|sec|secs|second|seconds)|\d+(?:\.\d+)?\s*(?:h|m|s))/gi;
    // Build list of matches
    const matches: {ms:number; index:number; len:number; text:string}[] = [];
    let mm: RegExpExecArray | null;
    while ((mm = durRegex.exec(part)) !== null) {
      const txt = mm[0];
      const ms = parseDuration(txt);
      if (ms!==null && ms>0) matches.push({ms, index:mm.index, len:txt.length, text:txt});
    }
    // also handle bare numbers as seconds if no unit matched? e.g. "add 90 eggs" -> 90s
    if (matches.length===0) {
      // try bare number at start
      const bare = part.match(/^\s*(\d+(?:\.\d+)?)\b/);
      if (bare) {
        const ms = parseDuration(bare[1]);
        if (ms!==null) matches.push({ms, index: bare.index!, len: bare[0].length, text: bare[0]});
      }
    }
    if (matches.length===0) {
      return {kind:'unknown', raw:rest, error:`Could not parse duration in "${part}". Use e.g. "5m", "1h30m", "90s", "05:00"`} as unknown as ParsedCommand;
    }
    for (let i=0;i<matches.length;i++) {
      const cur = matches[i];
      const nextIdx = i+1<matches.length ? matches[i+1].index : part.length;
      const labelRaw = part.slice(cur.index + cur.len, nextIdx).trim().replace(/^[,;]+|[,;]+$/g,'').replace(/^and\s+/i,'').trim();
      // remove quotes
      const labelClean = labelRaw.replace(/^["']|["']$/g,'').trim();
      const label = labelClean || `Timer ${autoCounter++}`;
      timers.push({label, ms: cur.ms});
    }
  }
  if (timers.length===0) return {kind:'unknown', raw:rest, error:'No valid timers found'} as unknown as ParsedCommand;
  return {kind:'add', timers, raw:rest};
}

export function helpText(): string {
  return [
    'Commands:',
    '  add 5m eggs              — add timer',
    '  add 25m focus, 5m break  — multiple timers (comma, ; or space separated)',
    '  add 1h30m roast / add 05:00 pasta / add 90s tea',
    '  pause <label|all>        — pause',
    '  resume <label|all>',
    '  stop <label|all>         — reset to initial duration',
    '  delete <label|all>',
    '  repeat <label> [3|infinite|off] — toggle repeat',
    '  toggle <label|all>       — switch clock ↔ digital',
    '  clear / clear finished   — remove finished timers',
    '  help                     — show this',
    'Tips: durations support 1h 30m 15s, 90s, 5m, 01:30:00. Separate commands with ;',
  ].join('\n');
}
