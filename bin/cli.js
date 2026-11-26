#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { wrapped, renderTerminal, renderHtml, renderSvg } from '../src/index.js';

const pkg = JSON.parse(fs.readFileSync(fileURLToPath(new URL('../package.json', import.meta.url)), 'utf8'));

const HELP = `
commits-wrapped v${pkg.version}: Spotify Wrapped for your git repo

Usage
  npx commits-wrapped [path] [options]

Options
  -y, --year <YYYY>     Year to wrap (default: current year)
      --me              Only your commits (uses git config user.email)
  -a, --author <pat>    Only commits by author matching <pat>
  -o, --out <file>      HTML card path (default: ./commits-wrapped-<year>.html)
      --no-html         Terminal output only
      --no-open         Write the HTML card but do not open it
      --json            Print raw stats as JSON
  -h, --help            Show help
  -v, --version         Show version
`;

function parseArgs(argv) {
  const o = { path: '.', html: true, open: true };
  const need = (i, flag) => {
    if (i + 1 >= argv.length) throw new Error(`${flag} needs a value`);
    return argv[i + 1];
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '-h' || a === '--help') o.help = true;
    else if (a === '-v' || a === '--version') o.version = true;
    else if (a === '-y' || a === '--year') {
      o.year = Number(need(i++, a));
      if (!Number.isInteger(o.year) || o.year < 1970 || o.year > 9999) throw new Error('--year must be a 4-digit year');
    } else if (a === '--me') o.me = true;
    else if (a === '-a' || a === '--author') o.author = need(i++, a);
    else if (a === '-o' || a === '--out') o.out = need(i++, a);
    else if (a === '--no-html') o.html = false;
    else if (a === '--no-open') o.open = false;
    else if (a === '--json') o.json = true;
    else if (a.startsWith('-')) throw new Error(`Unknown option: ${a}`);
    else o.path = a;
  }
  return o;
}

function openFile(file) {
  const [cmd, args] =
    process.platform === 'win32'
      ? ['cmd', ['/c', 'start', '', file]]
      : process.platform === 'darwin'
        ? ['open', [file]]
        : ['xdg-open', [file]];
  try {
    const child = spawn(cmd, args, { detached: true, stdio: 'ignore' });
    child.on('error', () => {});
    child.unref();
  } catch {
    /* opening is best-effort */
  }
}

try {
  const o = parseArgs(process.argv.slice(2));
  if (o.help) {
    console.log(HELP);
    process.exit(0);
  }
  if (o.version) {
    console.log(pkg.version);
    process.exit(0);
  }

  const stats = wrapped({ cwd: path.resolve(o.path), year: o.year, author: o.author, me: o.me });

  if (o.json) {
    console.log(JSON.stringify(stats, null, 2));
    process.exit(0);
  }

  console.log(renderTerminal(stats));

  if (o.html && stats.total) {
    const out = path.resolve(o.out ?? `commits-wrapped-${stats.year}.html`);
    fs.writeFileSync(out, renderHtml(stats));
    const svgOut = out.replace(/\.html?$/i, '') + '.svg';
    fs.writeFileSync(svgOut, renderSvg(stats));
    console.log(`  Share card (open, then "Download PNG") → ${out}`);
    console.log(`  Share image (SVG, 1080×1350)          → ${svgOut}\n`);
    if (o.open) openFile(out);
  }
} catch (err) {
  console.error(`commits-wrapped: ${err.message}`);
  process.exit(1);
}
