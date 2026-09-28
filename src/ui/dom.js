import { Capacitor } from '@capacitor/core';
import { icon } from './icons.js';

export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

export function h(html) {
  const t = document.createElement('template');
  t.innerHTML = html.trim();
  return t.content.firstElementChild;
}

export const ICO = {
  coin: '<span class="ico ico-coin inline-ico"></span>',
  cheese: '<span class="ico ico-cheese inline-ico"></span>',
  quill: '<span class="ico ico-quill inline-ico"></span>',
};
// Inline icon for text: ig('heart')
export const ig = (name) => `<span class="ig">${icon(name)}</span>`;

// Fill every [data-icon] placeholder in a root with its SVG.
export function paintIcons(root = document) {
  root.querySelectorAll('[data-icon]').forEach((el) => { if (!el.dataset.painted) { el.innerHTML = icon(el.dataset.icon); el.dataset.painted = '1'; } });
}

export function toast(text, cls = '', iconName = null) {
  const el = h(`<div class="toast ${cls}">${iconName ? icon(iconName) : ''}<span>${text}</span></div>`);
  $('#toasts').appendChild(el);
  while ($('#toasts').children.length > 3) $('#toasts').firstElementChild.remove();
  setTimeout(() => el.remove(), 3000);
}

export function bigText(text) {
  const el = h(`<div class="big-text">${text}</div>`);
  $('#fxLayer').appendChild(el);
  setTimeout(() => el.remove(), 1700);
}

// Coins (or cheese) fly from a point to a HUD element.
export function flyTo(from, toEl, n = 8, kind = 'coin', onArrive) {
  const layer = $('#fxLayer');
  const tr = toEl.getBoundingClientRect();
  const tx = tr.left + 18; const ty = tr.top + tr.height / 2 - 11;
  let arrived = 0;
  for (let k = 0; k < n; k++) {
    const el = h(`<span class="fly ico ico-${kind}"></span>`);
    layer.appendChild(el);
    const sx = from.x + (Math.random() - 0.5) * 40; const sy = from.y + (Math.random() - 0.5) * 30;
    const mx = (sx + tx) / 2 + (Math.random() - 0.5) * 140; const my = Math.min(sy, ty) - 60 - Math.random() * 80;
    const dur = 550 + Math.random() * 300; const delay = k * 35;
    const anim = el.animate([
      { transform: `translate(${sx}px, ${sy}px) scale(0.6)`, offset: 0 },
      { transform: `translate(${mx}px, ${my}px) scale(1.2)`, offset: 0.45 },
      { transform: `translate(${tx}px, ${ty}px) scale(0.8)`, offset: 1 },
    ], { duration: dur, delay, easing: 'cubic-bezier(.4,.1,.6,1)', fill: 'backwards' });
    anim.onfinish = () => {
      el.remove();
      arrived++;
      if (arrived === 1 || arrived === n) onArrive?.(arrived === n);
    };
  }
}

export function centerOf(el) {
  const r = el.getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
}

let hapticsOn = true;
let Haptics = null;
if (Capacitor.isNativePlatform()) import('@capacitor/haptics').then((m) => { Haptics = m.Haptics; }).catch(() => {});
export function setHaptics(on) { hapticsOn = on; }
export function haptic(kind = 'light') {
  if (!hapticsOn) return;
  try {
    if (Haptics) Haptics.impact({ style: kind === 'heavy' ? 'HEAVY' : kind === 'medium' ? 'MEDIUM' : 'LIGHT' });
    else if (navigator.vibrate) navigator.vibrate(kind === 'heavy' ? 30 : kind === 'medium' ? 16 : 8);
  } catch { /* ignore */ }
}
