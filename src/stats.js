const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const NOISE_FILES = /(^|\/)(package-lock\.json|yarn\.lock|pnpm-lock\.yaml|bun\.lockb?|Cargo\.lock|poetry\.lock|composer\.lock|Gemfile\.lock|go\.sum)$|(^|\/)(node_modules|dist|build|vendor)\//;

const STOPWORDS = new Set(
  ('the and for with from this that into over then than when add added adds update updated updates ' +
    'use used using make made via not are was has have had out but its you your all can new').split(' '),
);

const FIX_RE = /\b(fix|fixes|fixed|fixing|bug|bugfix|hotfix|patch)\b/i;
const OOPS_RE = /\b(typo|oops|whoops|forgot|forgotten|revert|reverts|reverted|undo|again)\b/i;
const WIP_RE = /\b(wip|temp|tmp|todo|stuff|misc|asdf|test|testing)\b/i;

function parseLocal(iso) {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})/.exec(iso);
  const [y, mo, d, h, mi] = m.slice(1, 6).map(Number);
  const dayNum = Math.floor(Date.UTC(y, mo - 1, d) / 86400000);
  return { y, mo, d, h, mi, dayNum, dow: new Date(Date.UTC(y, mo - 1, d)).getUTCDay() };
}

function topN(map, n) {
  return [...map.entries()].sort((a, b) => b[1] - a[1] || String(a[0]).localeCompare(String(b[0]))).slice(0, n);
}

function longestStreak(daySet) {
  const days = [...daySet].sort((a, b) => a - b);
  let best = 0;
  let run = 0;
  let bestEnd = null;
  let prev = null;
  for (const d of days) {
    run = prev !== null && d === prev + 1 ? run + 1 : 1;
    if (run > best) {
      best = run;
      bestEnd = d;
    }
    prev = d;
  }
  const dateOf = (n) => new Date(n * 86400000).toISOString().slice(0, 10);
  return best ? { length: best, from: dateOf(bestEnd - best + 1), to: dateOf(bestEnd) } : { length: 0, from: null, to: null };
}

export function pickPersona(s) {
  const { total, hours, weekendShare, fixShare, streak, peakHour } = s;
  const night = hours.slice(0, 5).reduce((a, b) => a + b, 0) + hours[23];
  const early = hours.slice(5, 9).reduce((a, b) => a + b, 0);
  const nightShare = night / total;
  const earlyShare = early / total;

  if (nightShare >= 0.3) return { name: 'The Night Owl', emoji: '🦉', blurb: `${Math.round(nightShare * 100)}% of your commits happened after dark. Sleep is a suggestion.` };
  if (fixShare >= 0.3) return { name: 'The Firefighter', emoji: '🚒', blurb: `${Math.round(fixShare * 100)}% of your commits were fixes. Someone has to save production.` };
  if (streak.length >= 14) return { name: 'The Streak Machine', emoji: '🔥', blurb: `${streak.length} days in a row. Touch grass? Never heard of her.` };
  if (weekendShare >= 0.35) return { name: 'The Weekend Warrior', emoji: '⚔️', blurb: `${Math.round(weekendShare * 100)}% of your commits landed on weekends. Side projects never sleep.` };
  if (earlyShare >= 0.25) return { name: 'The Early Bird', emoji: '🐦', blurb: `Most of your work lands before 9am. Coffee does the committing.` };
  if (peakHour >= 9 && peakHour <= 17) return { name: 'The Nine-to-Fiver', emoji: '🕘', blurb: `Peak commit hour: ${fmtHour(peakHour)}. Healthy boundaries. Suspicious.` };
  return { name: 'The Steady Shipper', emoji: '🚢', blurb: 'No drama, just commits. The backbone of every team.' };
}

export function fmtHour(h) {
  const suffix = h < 12 ? 'am' : 'pm';
  const hh = h % 12 === 0 ? 12 : h % 12;
  return `${hh}${suffix}`;
}

export function computeStats(commits, { year, repo }) {
  const total = commits.length;
  const hours = new Array(24).fill(0);
  const dows = new Array(7).fill(0);
  const months = new Array(12).fill(0);
  const daySet = new Set();
  const fileTouches = new Map();
  const authors = new Map();
  const words = new Map();
  let added = 0;
  let removed = 0;
  let fixes = 0;
  let oops = 0;
  let wip = 0;
  let biggest = null;
  let longestMsg = null;
  let busiestDay = new Map();

  for (const c of commits) {
    const t = parseLocal(c.date);
    hours[t.h]++;
    dows[t.dow]++;
    months[t.mo - 1]++;
    daySet.add(t.dayNum);
    const dayKey = `${t.y}-${String(t.mo).padStart(2, '0')}-${String(t.d).padStart(2, '0')}`;
    busiestDay.set(dayKey, (busiestDay.get(dayKey) ?? 0) + 1);

    added += c.added;
    removed += c.removed;
    authors.set(c.name, (authors.get(c.name) ?? 0) + 1);

    for (const f of c.files) {
      if (NOISE_FILES.test(f)) continue;
      fileTouches.set(f, (fileTouches.get(f) ?? 0) + 1);
    }

    if (FIX_RE.test(c.subject)) fixes++;
    if (OOPS_RE.test(c.subject)) oops++;
    if (WIP_RE.test(c.subject)) wip++;

    const size = c.added + c.removed;
    if (!biggest || size > biggest.size) biggest = { size, subject: c.subject, added: c.added, removed: c.removed, hash: c.hash.slice(0, 7) };
    if (!longestMsg || c.subject.length > longestMsg.length) longestMsg = c.subject;

    for (const w of c.subject.toLowerCase().split(/[^a-z]+/)) {
      if (w.length > 2 && !STOPWORDS.has(w)) words.set(w, (words.get(w) ?? 0) + 1);
    }
  }

  const peakHour = total ? hours.indexOf(Math.max(...hours)) : 0;
  const peakDow = total ? dows.indexOf(Math.max(...dows)) : 0;
  const peakMonth = total ? months.indexOf(Math.max(...months)) : 0;
  const weekendShare = total ? (dows[0] + dows[6]) / total : 0;
  const fixShare = total ? fixes / total : 0;
  const streak = longestStreak(daySet);
  const [topDay] = topN(busiestDay, 1);

  const base = { total, hours, weekendShare, fixShare, streak, peakHour };
  const persona = total ? pickPersona(base) : { name: 'The Ghost', emoji: '👻', blurb: 'No commits found. Spooky.' };

  return {
    repo,
    year,
    total,
    activeDays: daySet.size,
    added,
    removed,
    net: added - removed,
    hours,
    dows,
    dowNames: DAYS,
    months,
    monthNames: MONTHS,
    peakHour,
    peakDay: DAYS[peakDow],
    peakMonth: MONTHS[peakMonth],
    weekendShare,
    streak,
    busiestDay: topDay ? { date: topDay[0], commits: topDay[1] } : null,
    topFiles: topN(fileTouches, 5).map(([file, touches]) => ({ file, touches })),
    topAuthors: topN(authors, 5).map(([name, commits]) => ({ name, commits })),
    topWords: topN(words, 5).map(([word, count]) => ({ word, count })),
    fixes,
    oops,
    wip,
    biggest,
    longestMsg,
    persona,
  };
}
