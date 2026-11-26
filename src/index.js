import { isRepo, repoName, readCommits, configEmail } from './git.js';
import { computeStats } from './stats.js';
import { renderTerminal } from './terminal.js';
import { renderHtml, shareText } from './html.js';

/**
 * Compute wrapped stats for a git repo.
 * @param {{cwd?: string, year?: number, author?: string, me?: boolean}} [opts]
 */
export function wrapped({ cwd = process.cwd(), year = new Date().getFullYear(), author, me = false } = {}) {
  if (!isRepo(cwd)) throw new Error(`Not a git repository: ${cwd}`);
  let who = author;
  if (me) {
    who = configEmail(cwd);
    if (!who) throw new Error('--me needs `git config user.email` to be set.');
  }
  const commits = readCommits({ cwd, year, author: who });
  return computeStats(commits, { year, repo: repoName(cwd) });
}

import { renderSvg } from './svg.js';

export { renderTerminal, renderHtml, renderSvg, shareText, computeStats };
