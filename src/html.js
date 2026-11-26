import { fmtHour } from './stats.js';
import { renderSvg, SVG_W, SVG_H } from './svg.js';

const esc = (s) =>
  String(s).replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch]);
const n = (x) => x.toLocaleString('en-US');

export function shareText(s) {
  return (
    `My Git Wrapped ${s.year} ${s.persona.emoji}\n` +
    `I'm ${s.persona.name}: ${n(s.total)} commits, ${s.activeDays} active days, ${s.streak.length}-day streak.\n` +
    `Peak hour: ${fmtHour(s.peakHour)}. Get yours: npx git-wrapped`
  );
}

function bars(values, labels, cls) {
  const max = Math.max(...values, 1);
  return values
    .map(
      (v, i) =>
        `<div class="col ${cls}" title="${esc(labels[i])}: ${v}"><i style="height:${Math.max(v ? 4 : 0, (v / max) * 100)}%"></i><b>${esc(labels[i])}</b></div>`,
    )
    .join('');
}

export function renderHtml(s) {
  const hourLabels = s.hours.map((_, h) => (h % 6 === 0 ? String(h) : ''));
  const dowOrder = [1, 2, 3, 4, 5, 6, 0];
  const dowVals = dowOrder.map((d) => s.dows[d]);
  const dowLabels = dowOrder.map((d) => s.dowNames[d].slice(0, 3));

  const files = s.topFiles
    .map((f, i) => `<li><span>${i + 1}</span><code>${esc(f.file)}</code><em>×${f.touches}</em></li>`)
    .join('');
  const words = s.topWords.map((w) => `<span class="chip">${esc(w.word)} <em>×${w.count}</em></span>`).join('');

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Git Wrapped ${s.year} · ${esc(s.repo)}</title>
<style>
*{box-sizing:border-box;margin:0}
body{min-height:100vh;display:grid;place-items:center;padding:32px 16px;background:#0b0b14;font-family:ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;color:#f4f4ff}
.card{width:100%;max-width:560px;border-radius:28px;padding:36px 32px;background:radial-gradient(120% 80% at 0% 0%,#ff4fd8 0%,transparent 55%),radial-gradient(120% 90% at 100% 100%,#3b82f6 0%,transparent 55%),#14102b;box-shadow:0 30px 80px #000a,inset 0 0 0 1px #ffffff1a}
.top{display:flex;justify-content:space-between;align-items:center;font-size:13px;letter-spacing:.14em;text-transform:uppercase;opacity:.85}
.top b{font-weight:800}
.hero{margin:28px 0 8px;text-align:center}
.emoji{font-size:72px;line-height:1}
.persona{font-size:34px;font-weight:900;letter-spacing:-.02em;margin-top:8px}
.blurb{opacity:.8;margin-top:6px;font-size:15px}
.grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin:26px 0}
.stat{background:#ffffff14;border-radius:16px;padding:14px 10px;text-align:center;backdrop-filter:blur(6px)}
.stat b{display:block;font-size:26px;font-weight:900}
.stat span{font-size:11px;letter-spacing:.1em;text-transform:uppercase;opacity:.7}
h3{font-size:12px;letter-spacing:.14em;text-transform:uppercase;opacity:.75;margin:22px 0 10px}
.chart{display:flex;gap:3px;align-items:flex-end;height:90px}
.col{flex:1;height:100%;display:flex;flex-direction:column;justify-content:flex-end;align-items:center;gap:4px;position:relative}
.col i{display:block;width:100%;background:linear-gradient(#fff,#ffffff80);border-radius:4px 4px 2px 2px}
.col b{font-size:10px;font-weight:600;opacity:.65;height:12px}
.col.d{height:90px}
ol{list-style:none;padding:0;display:grid;gap:6px}
li{display:flex;gap:10px;align-items:center;background:#ffffff10;border-radius:10px;padding:8px 12px;font-size:14px}
li span{opacity:.5;width:14px}
li code{flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-family:ui-monospace,Menlo,Consolas,monospace;font-size:13px}
li em,.chip em{opacity:.6;font-style:normal}
.chips{display:flex;flex-wrap:wrap;gap:8px}
.chip{background:#ffffff1c;border-radius:999px;padding:6px 12px;font-size:14px;font-weight:600}
.conf{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;text-align:center;font-size:13px}
.conf div{background:#ffffff10;border-radius:12px;padding:10px}
.conf b{display:block;font-size:22px}
.foot{margin-top:28px;text-align:center;font-size:13px;opacity:.85}
.foot code{background:#0006;padding:4px 10px;border-radius:8px;font-family:ui-monospace,Menlo,Consolas,monospace}
.actions{margin-top:20px;text-align:center}
button{all:unset;cursor:pointer;background:#fff;color:#14102b;font-weight:800;padding:10px 20px;border-radius:999px;font-size:14px}
button:active{transform:scale(.97)}
@media print{button,.actions{display:none}}
</style>
</head>
<body>
<main class="card" id="card">
  <div class="top"><b>✦ Git Wrapped ${s.year}</b><span>${esc(s.repo)}</span></div>
  <section class="hero">
    <div class="emoji">${s.persona.emoji}</div>
    <div class="persona">${esc(s.persona.name)}</div>
    <p class="blurb">${esc(s.persona.blurb)}</p>
  </section>
  <section class="grid">
    <div class="stat"><b>${n(s.total)}</b><span>commits</span></div>
    <div class="stat"><b>${n(s.activeDays)}</b><span>active days</span></div>
    <div class="stat"><b>${s.streak.length}</b><span>day streak</span></div>
    <div class="stat"><b>+${n(s.added)}</b><span>lines added</span></div>
    <div class="stat"><b>−${n(s.removed)}</b><span>lines deleted</span></div>
    <div class="stat"><b>${fmtHour(s.peakHour)}</b><span>peak hour</span></div>
  </section>
  <h3>Your 24 hours · busiest on ${esc(s.peakDay)}s</h3>
  <div class="chart">${bars(s.hours, hourLabels, 'h')}</div>
  <h3>Your week</h3>
  <div class="chart">${bars(dowVals, dowLabels, 'd')}</div>
  ${files ? `<h3>Files you could not leave alone</h3><ol>${files}</ol>` : ''}
  ${words ? `<h3>Your vocabulary</h3><div class="chips">${words}</div>` : ''}
  <h3>Confessions</h3>
  <div class="conf">
    <div><b>${s.fixes}</b>fix commits</div>
    <div><b>${s.oops}</b>oops / reverts</div>
    <div><b>${s.wip}</b>wip / test</div>
  </div>
  <div class="foot">Get yours → <code>npx git-wrapped</code></div>
  <div class="actions"><button id="png">Download PNG</button> <button id="copy">Copy share text</button></div>
</main>
<script>
const text = ${JSON.stringify(shareText(s)).replace(/</g, '\\u003c')};
const btn = document.getElementById('copy');
btn.onclick = async () => {
  try { await navigator.clipboard.writeText(text); btn.textContent = 'Copied ✓'; }
  catch { prompt('Copy this:', text); }
  setTimeout(() => (btn.textContent = 'Copy share text'), 1800);
};
const svg = ${JSON.stringify(renderSvg(s)).replace(/</g, '\\u003c')};
document.getElementById('png').onclick = () => {
  const img = new Image();
  img.onload = () => {
    const cv = document.createElement('canvas');
    cv.width = ${SVG_W}; cv.height = ${SVG_H};
    cv.getContext('2d').drawImage(img, 0, 0);
    cv.toBlob((b) => {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(b);
      a.download = 'git-wrapped-${s.year}.png';
      a.click();
    });
  };
  img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
};
</script>
</body>
</html>
`;
}
