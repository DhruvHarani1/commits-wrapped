import { fmtHour } from './stats.js';

export const SVG_W = 1080;
export const SVG_H = 1350;

const esc = (s) =>
  String(s).replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch]);
const n = (x) => x.toLocaleString('en-US');
const FONT = "'Segoe UI', system-ui, -apple-system, Roboto, 'Helvetica Neue', Arial, sans-serif";
const MONO = "ui-monospace, Menlo, Consolas, 'Courier New', monospace";

function wrap(text, max) {
  const lines = [];
  let cur = '';
  for (const word of text.split(' ')) {
    if ((cur + ' ' + word).trim().length > max) {
      lines.push(cur);
      cur = word;
    } else cur = (cur + ' ' + word).trim();
  }
  if (cur) lines.push(cur);
  return lines.slice(0, 3);
}

function trunc(s, len) {
  return s.length > len ? s.slice(0, len - 1) + '…' : s;
}

function statBox(x, y, value, label) {
  return `
  <rect x="${x}" y="${y}" width="296" height="130" rx="24" fill="#ffffff" fill-opacity="0.10"/>
  <text x="${x + 148}" y="${y + 70}" text-anchor="middle" font-size="46" font-weight="800" fill="#fff">${esc(value)}</text>
  <text x="${x + 148}" y="${y + 106}" text-anchor="middle" font-size="18" letter-spacing="3" fill="#fff" fill-opacity="0.65">${esc(label.toUpperCase())}</text>`;
}

/** Self-contained 1080x1350 share card (portrait, social-friendly). */
export function renderSvg(s) {
  const L = 72;
  const innerW = SVG_W - L * 2;

  const blurb = wrap(s.persona.blurb, 52)
    .map((t, i) => `<text x="${SVG_W / 2}" y="${492 + i * 38}" text-anchor="middle" font-size="27" fill="#fff" fill-opacity="0.8">${esc(t)}</text>`)
    .join('');

  const maxH = Math.max(...s.hours, 1);
  const slot = innerW / 24;
  const hourBars = s.hours
    .map((v, h) => {
      const bh = v ? Math.max(6, (v / maxH) * 110) : 0;
      const x = L + h * slot + 3;
      const label = h % 6 === 0 ? `<text x="${x + (slot - 6) / 2}" y="1086" text-anchor="middle" font-size="16" fill="#fff" fill-opacity="0.6">${h}h</text>` : '';
      return `<rect x="${x}" y="${1060 - bh}" width="${slot - 6}" height="${bh}" rx="4" fill="url(#bar)"/>${label}`;
    })
    .join('');

  const files = s.topFiles
    .slice(0, 3)
    .map((f, i) => {
      const y = 1178 + i * 44;
      return `<text x="${L}" y="${y}" font-size="22" fill="#fff" fill-opacity="0.5">${i + 1}</text>
  <text x="${L + 34}" y="${y}" font-size="22" font-family="${MONO}" fill="#fff">${esc(trunc(f.file, 46))}</text>
  <text x="${SVG_W - L}" y="${y}" text-anchor="end" font-size="22" fill="#fff" fill-opacity="0.6">×${f.touches}</text>`;
    })
    .join('');

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${SVG_W}" height="${SVG_H}" viewBox="0 0 ${SVG_W} ${SVG_H}" font-family="${FONT}">
  <defs>
    <radialGradient id="pink" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(0 0) rotate(45) scale(1100)">
      <stop offset="0" stop-color="#ff4fd8"/><stop offset="1" stop-color="#ff4fd8" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="blue" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(1080 1350) rotate(225) scale(1200)">
      <stop offset="0" stop-color="#3b82f6"/><stop offset="1" stop-color="#3b82f6" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="bar" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#fff"/><stop offset="1" stop-color="#fff" stop-opacity="0.5"/>
    </linearGradient>
  </defs>
  <rect width="${SVG_W}" height="${SVG_H}" fill="#14102b"/>
  <rect width="${SVG_W}" height="${SVG_H}" fill="url(#pink)"/>
  <rect width="${SVG_W}" height="${SVG_H}" fill="url(#blue)"/>

  <text x="${L}" y="118" font-size="24" font-weight="800" letter-spacing="5" fill="#fff">✦ COMMITS WRAPPED ${s.year}</text>
  <text x="${SVG_W - L}" y="118" text-anchor="end" font-size="24" letter-spacing="2" fill="#fff" fill-opacity="0.8">${esc(trunc(s.repo, 18).toUpperCase())}</text>

  <text x="${SVG_W / 2}" y="320" text-anchor="middle" font-size="150">${s.persona.emoji}</text>
  <text x="${SVG_W / 2}" y="426" text-anchor="middle" font-size="68" font-weight="900" fill="#fff">${esc(s.persona.name)}</text>
  ${blurb}

  ${statBox(L, 590, n(s.total), 'commits')}
  ${statBox(L + 320, 590, n(s.activeDays), 'active days')}
  ${statBox(L + 640, 590, String(s.streak.length), 'day streak')}
  ${statBox(L, 740, '+' + n(s.added), 'lines added')}
  ${statBox(L + 320, 740, '−' + n(s.removed), 'lines deleted')}
  ${statBox(L + 640, 740, fmtHour(s.peakHour), 'peak hour')}

  <text x="${L}" y="925" font-size="20" font-weight="700" letter-spacing="4" fill="#fff" fill-opacity="0.7">YOUR 24 HOURS · BUSIEST ON ${esc(s.peakDay.toUpperCase())}S</text>
  ${hourBars}

  ${files ? `<text x="${L}" y="1140" font-size="20" font-weight="700" letter-spacing="4" fill="#fff" fill-opacity="0.7">FILES YOU COULD NOT LEAVE ALONE</text>${files}` : ''}

  <text x="${SVG_W / 2}" y="1316" text-anchor="middle" font-size="26" fill="#fff" fill-opacity="0.9">Get yours → <tspan font-family="${MONO}" font-weight="700">npx commits-wrapped</tspan></text>
</svg>
`;
}
