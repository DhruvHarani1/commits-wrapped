# ✦ git-wrapped

**Spotify Wrapped for your git repo.** One command. Zero dependencies. A card you'll want to post.

```bash
npx git-wrapped
```

You get a terminal report **and** a self-contained HTML card (opens automatically) with:

- 🦉 your **developer persona** (Night Owl, Firefighter, Streak Machine, Weekend Warrior, Early Bird…)
- commits, active days, longest streak, lines added / deleted
- your 24-hour and weekly commit rhythm
- the files you could not leave alone
- your commit-message vocabulary
- confessions: how many `fix`, `oops`, `revert`, `wip` commits you made

Hit **Download PNG** on the card (1080×1350, made for social posts), or grab the `.svg` it writes next to the HTML.

Everything runs **locally**. Nothing is uploaded, ever.

## Usage

```bash
npx git-wrapped                 # current repo, current year
npx git-wrapped --me            # only your commits (git config user.email)
npx git-wrapped --year 2025     # a different year
npx git-wrapped ../other-repo   # another repo
npx git-wrapped --json          # raw stats
```

| Option | Description |
| --- | --- |
| `-y, --year <YYYY>` | Year to wrap (default: current year) |
| `--me` | Only your commits |
| `-a, --author <pattern>` | Only commits by matching author |
| `-o, --out <file>` | HTML card path (default `./git-wrapped-<year>.html`) |
| `--no-html` | Terminal output only |
| `--no-open` | Write the card but don't open it |
| `--json` | Print stats as JSON |

Merge commits are skipped. Times use each author's own local clock. Lockfiles and `node_modules`/`dist` don't count toward "most-touched files".

## API

```js
import { wrapped, renderHtml } from 'git-wrapped';

const stats = wrapped({ cwd: '.', year: 2026, me: true });
console.log(stats.persona.name, stats.total);
```

## Requirements

Node 18+ and `git` on your PATH.

## License

MIT
