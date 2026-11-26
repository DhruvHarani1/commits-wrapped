import { fmtHour } from './stats.js';

const useColor = !process.env.NO_COLOR && (process.stdout.isTTY || process.env.FORCE_COLOR);
const c = (code) => (s) => (useColor ? `\x1b[${code}m${s}\x1b[0m` : String(s));
const bold = c('1');
const dim = c('2');
const pink = c('38;5;213');
const cyan = c('38;5;51');
const yellow = c('38;5;227');
const green = c('38;5;84');
const violet = c('38;5;141');

const n = (x) => x.toLocaleString('en-US');

function bar(value, max, width = 24) {
  if (!max) return '';
  const len = Math.max(value > 0 ? 1 : 0, Math.round((value / max) * width));
  return '█'.repeat(len);
}

function trunc(s, len) {
  return s.length > len ? s.slice(0, len - 1) + '…' : s;
}

export function renderTerminal(s) {
  const L = [];
  const line = (x = '') => L.push(x);

  line();
  line(`  ${bold(pink('✦ COMMITS WRAPPED ' + s.year))}  ${dim('·')}  ${bold(s.repo)}`);
  line(`  ${dim('─'.repeat(52))}`);

  if (!s.total) {
    line(`  ${dim('No commits found for ' + s.year + '. Try --year ' + (s.year - 1) + ' or drop --me.')}`);
    line();
    return L.join('\n');
  }

  line();
  line(`  ${bold(s.persona.emoji + '  You are ' + yellow(s.persona.name))}`);
  line(`  ${dim(s.persona.blurb)}`);
  line();
  line(`  ${bold(cyan(n(s.total)))} commits   ${bold(cyan(n(s.activeDays)))} active days   ${bold(cyan(s.streak.length))}-day best streak`);
  line(`  ${green('+' + n(s.added))} ${dim('/')} ${pink('-' + n(s.removed))} lines   ${dim('net')} ${bold(s.net >= 0 ? '+' + n(s.net) : n(s.net))}`);
  line();

  line(`  ${bold('When you code')}  ${dim('peak: ' + fmtHour(s.peakHour) + ' on ' + s.peakDay + 's, busiest month ' + s.peakMonth)}`);
  const maxH = Math.max(...s.hours);
  const blocks = ' ▁▂▃▄▅▆▇█';
  const spark = s.hours.map((v) => (maxH ? blocks[Math.round((v / maxH) * 8)] : ' ')).join('');
  line(`  ${violet(spark)}  ${dim('0h → 23h')}`);
  line();

  const maxD = Math.max(...s.dows);
  const order = [1, 2, 3, 4, 5, 6, 0];
  for (const d of order) {
    line(`  ${dim(s.dowNames[d].slice(0, 3))} ${cyan(bar(s.dows[d], maxD))} ${dim(n(s.dows[d]))}`);
  }
  line();

  if (s.topFiles.length) {
    line(`  ${bold('Files you could not leave alone')}`);
    s.topFiles.forEach((f, i) => line(`  ${dim(i + 1 + '.')} ${trunc(f.file, 44)} ${dim('×' + f.touches)}`));
    line();
  }

  if (s.topWords.length) {
    line(`  ${bold('Your vocabulary')}  ${s.topWords.map((w) => yellow(w.word) + dim('×' + w.count)).join('  ')}`);
  }
  line(`  ${bold('Confessions')}  ${s.fixes} fix commits ${dim('·')} ${s.oops} oops/revert ${dim('·')} ${s.wip} wip/test`);
  if (s.biggest && s.biggest.size) {
    line(`  ${bold('Biggest commit')}  ${dim(s.biggest.hash)} ${trunc(s.biggest.subject, 36)} ${dim('(' + n(s.biggest.size) + ' lines)')}`);
  }
  if (s.topAuthors.length > 1) {
    line();
    line(`  ${bold('Squad')}  ${s.topAuthors.map((a) => a.name + dim('×' + a.commits)).join(dim('  ·  '))}`);
  }
  line();
  return L.join('\n');
}
