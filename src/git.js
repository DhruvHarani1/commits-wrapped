import { execFileSync } from 'node:child_process';
import path from 'node:path';

const RS = '\x1e';
const US = '\x1f';

function git(args, cwd) {
  return execFileSync('git', args, {
    cwd,
    encoding: 'utf8',
    maxBuffer: 1 << 30,
    stdio: ['ignore', 'pipe', 'pipe'],
  });
}

export function isRepo(cwd) {
  try {
    return git(['rev-parse', '--is-inside-work-tree'], cwd).trim() === 'true';
  } catch {
    return false;
  }
}

export function repoName(cwd) {
  try {
    return path.basename(git(['rev-parse', '--show-toplevel'], cwd).trim());
  } catch {
    return path.basename(path.resolve(cwd));
  }
}

export function configEmail(cwd) {
  try {
    return git(['config', 'user.email'], cwd).trim();
  } catch {
    return '';
  }
}

/**
 * Read non-merge commits for a calendar year.
 * Times are kept in the author's local clock (parsed straight from the ISO string).
 * @returns {{hash:string,name:string,email:string,date:string,subject:string,added:number,removed:number,files:string[]}[]}
 */
export function readCommits({ cwd, year, author }) {
  const args = [
    'log',
    '--no-merges',
    '--no-renames',
    '--numstat',
    // Margin on both sides so timezone offsets never drop edge commits;
    // exact year match is done below on the author's local date.
    `--since=${year - 1}-12-30T00:00:00`,
    `--until=${year + 1}-01-02T23:59:59`,
    '--pretty=format:%x1e%H%x1f%an%x1f%ae%x1f%aI%x1f%s',
  ];
  if (author) args.push(`--author=${author}`);

  let out;
  try {
    out = git(args, cwd);
  } catch (err) {
    // Repo with no commits yet
    if (/does not have any commits|bad default revision/i.test(String(err.stderr))) return [];
    throw err;
  }

  const commits = [];
  for (const rec of out.split(RS)) {
    if (!rec.trim()) continue;
    const [header, ...rest] = rec.split('\n');
    const [hash, name, email, date, subject] = header.split(US);
    if (!date || !date.startsWith(`${year}-`)) continue;
    let added = 0;
    let removed = 0;
    const files = [];
    for (const line of rest) {
      const m = /^(\d+|-)\t(\d+|-)\t(.+)$/.exec(line);
      if (!m) continue;
      if (m[1] !== '-') added += Number(m[1]);
      if (m[2] !== '-') removed += Number(m[2]);
      files.push(m[3]);
    }
    commits.push({ hash, name, email, date, subject: subject ?? '', added, removed, files });
  }
  return commits;
}
