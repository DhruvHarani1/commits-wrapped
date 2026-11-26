import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { wrapped, renderTerminal, renderHtml, renderSvg } from '../src/index.js';

function makeRepo() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'gw-'));
  const run = (args, date) =>
    execFileSync('git', args, {
      cwd: dir,
      stdio: 'pipe',
      env: { ...process.env, GIT_AUTHOR_DATE: date, GIT_COMMITTER_DATE: date },
    });
  run(['init', '-q'], '2024-01-01T00:00:00');
  run(['config', 'user.email', 'a@b.c'], '2024-01-01T00:00:00');
  run(['config', 'user.name', 'Tester'], '2024-01-01T00:00:00');
  run(['config', 'commit.gpgsign', 'false'], '2024-01-01T00:00:00');
  const commit = (file, body, msg, date) => {
    fs.writeFileSync(path.join(dir, file), body);
    run(['add', '-A'], date);
    run(['commit', '-q', '-m', msg], date);
  };
  commit('c.txt', 'old\n', 'old year', '2023-05-05T10:00:00'); // other year, must be excluded
  // 3-day streak, all after midnight
  commit('a.txt', 'one\ntwo\n', 'feat: first thing', '2024-03-10T01:15:00');
  commit('a.txt', 'one\ntwo\nthree\n', 'fix: bug in thing', '2024-03-11T02:30:00');
  commit('b.txt', 'x\n', 'fix typo again', '2024-03-12T03:45:00');
  commit('a.txt', 'z\n', 'later commit', '2024-07-04T14:00:00');
  return dir;
}

test('computes stats for a year', () => {
  const dir = makeRepo();
  const s = wrapped({ cwd: dir, year: 2024 });
  assert.equal(s.total, 4);
  assert.equal(s.activeDays, 4);
  assert.equal(s.streak.length, 3);
  assert.equal(s.fixes, 2);
  assert.equal(s.oops, 1);
  assert.equal(s.persona.name, 'The Night Owl');
  assert.equal(s.topFiles[0].file, 'a.txt');
  assert.equal(s.topFiles[0].touches, 3);
  assert.ok(s.added > 0);
});

test('other year excluded and empty year handled', () => {
  const dir = makeRepo();
  assert.equal(wrapped({ cwd: dir, year: 2023 }).total, 1);
  const empty = wrapped({ cwd: dir, year: 2020 });
  assert.equal(empty.total, 0);
  assert.match(renderTerminal(empty), /No commits found/);
});

test('renders html and escapes repo name', () => {
  const dir = makeRepo();
  const s = wrapped({ cwd: dir, year: 2024 });
  s.repo = '<script>alert(1)</script>';
  const html = renderHtml(s);
  assert.ok(!html.includes('<script>alert(1)'));
  assert.match(html, /npx commits-wrapped/);
});

test('renders valid escaped svg', () => {
  const dir = makeRepo();
  const s = wrapped({ cwd: dir, year: 2024 });
  s.repo = 'a&b<c>';
  const svg = renderSvg(s);
  assert.match(svg, /^<svg [^>]*viewBox="0 0 1080 1350"/);
  assert.ok(svg.includes('A&amp;B&lt;C&gt;'));
  assert.ok(!svg.includes('<C>'));
  assert.match(svg, /The Night Owl/);
  assert.match(svg, /<\/svg>\s*$/);
});

test('rejects non-repo', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'gw-none-'));
  assert.throws(() => wrapped({ cwd: dir }), /Not a git repository/);
});
