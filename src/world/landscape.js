// Garden landscaping for each branch, drawn on the grass apron in front of the library.
// Kept clear of the pond and dock (x < 190), the path (190..250), the lamp post and mailbox
// (250..300) and the seasonal props (285..340), so the busy parts of the garden never overlap.
import { BX0, BX1 } from './layout.js';
import { fillRR, ell, circ, rng, star } from './draw.js';

// Foundation under the building.
export function drawFoundation(ctx, scene, tint, winter) {
  const x0 = BX0 - 4; const w = BX1 - BX0 + 8;
  switch (scene) {
    case 'castle':
      ctx.fillStyle = tint('#8d8aa3'); ctx.fillRect(x0 - 4, -4, w + 8, 12);
      ctx.fillStyle = tint('#76738c'); for (let x = x0; x < x0 + w; x += 18) ctx.fillRect(x, -4, 1.2, 12); ctx.fillRect(x0 - 4, 2, w + 8, 1);
      break;
    case 'cove':
      ctx.fillStyle = tint('#9a8a72'); ctx.fillRect(x0, -2, w, 10);
      ctx.fillStyle = tint('#6b5a44'); for (let x = x0 + 6; x < x0 + w; x += 30) ctx.fillRect(x, -2, 4, 12);
      break;
    case 'pond':
      ctx.fillStyle = tint('#8f8a7a'); ctx.fillRect(x0, -2, w, 10);
      { const R = rng(44); for (let x = x0; x < x0 + w; x += 11) ell(ctx, x + 5, 3 + R() * 2, 6, 3.4, tint(R() < 0.5 ? '#9d9888' : '#858070')); for (let k = 0; k < 10; k++) ell(ctx, x0 + R() * w, 6, 5, 2, tint('#7fa05a')); }
      break;
    case 'windmill':
      ctx.fillStyle = tint('#a39a86'); ctx.fillRect(x0, -2, w, 10);
      { const R = rng(45); for (let x = x0; x < x0 + w; x += 9) ell(ctx, x + 4, 3, 4.6 + R() * 1.4, 3.2, tint(R() < 0.5 ? '#b4ab96' : '#948b77')); }
      break;
    default: // meadow (original)
      ctx.fillStyle = tint('#9d9486'); ctx.fillRect(x0, -2, w, 10);
      ctx.fillStyle = tint('#857c70'); for (let x = BX0; x < BX1; x += 22) ctx.fillRect(x, -2, 1.2, 10);
  }
  if (winter) { ctx.fillStyle = '#f7fafc'; ctx.fillRect(x0 - 1, -3.5, w + 2, 2.5); }
}

// Little grass tufts and pebbles all over the lawn (a bit of texture).
export function drawLawnDetail(ctx, scene, season, tint, L, R, density = 1) {
  if (scene === 'cove' || season.key === 'winter') return;
  const Rn = rng(61);
  ctx.strokeStyle = tint(season.key === 'autumn' ? '#9a8a3a' : '#5f9a4a'); ctx.lineWidth = 0.7;
  for (let k = 0; k < 70 * density; k++) {
    const x = L + Rn() * (R - L); const y = 10 + Rn() * 76;
    if (x > 16 && x < 178 && y > 22 && y < 78) continue; // pond
    if (x > 186 && x < 254) continue; // path
    ctx.beginPath(); ctx.moveTo(x - 1.5, y); ctx.lineTo(x - 2, y - 3); ctx.moveTo(x, y); ctx.lineTo(x, y - 4); ctx.moveTo(x + 1.5, y); ctx.lineTo(x + 2.2, y - 3); ctx.stroke();
  }
  for (let k = 0; k < 14; k++) { const y = 6 + Rn() * 82; const x = 196 + (y / 90) * 14 + Rn() * 40; ell(ctx, x, y, 1.6, 1, tint('#b8a37e')); }
}

// The big feature on the right of the garden (x 336..R) plus a few extras.
export function drawLandscape(ctx, scene, t, tod, season, tint, L, R) {
  const winter = season.key === 'winter';
  switch (scene) {
    case 'windmill': {
      // golden barley rows swaying in the wind, a hay cart and flour sacks
      const col = winter ? '#e8e1d6' : season.key === 'spring' ? '#a9cf6a' : '#e0b54a';
      for (let row = 0; row < 4; row++) {
        const y = 30 + row * 14;
        ctx.fillStyle = tint(winter ? '#dfe6ee' : '#9c7a3a'); ctx.fillRect(342, y + 1, R - 342, 2);
        for (let x = 344 + (row % 2) * 3; x < R; x += 5) {
          const sw = Math.sin(t * 1.6 + x * 0.08 + row) * 1.6;
          ctx.strokeStyle = tint(col); ctx.lineWidth = 0.9; ctx.beginPath(); ctx.moveTo(x, y + 1); ctx.quadraticCurveTo(x + sw * 0.5, y - 6, x + sw, y - 11); ctx.stroke();
          if (!winter) ell(ctx, x + sw, y - 12, 1.3, 3, tint(col), sw * 0.1);
        }
      }
      // hay cart
      const cx = 352; const cy = 82;
      fillRR(ctx, cx - 16, cy - 12, 32, 8, 2, tint('#8a5a3a'));
      ell(ctx, cx, cy - 16, 16, 7, tint(winter ? '#f1f4f8' : '#e8c465'));
      [cx - 10, cx + 10].forEach((wx) => { circ(ctx, wx, cy - 3, 5, tint('#6b4128')); circ(ctx, wx, cy - 3, 2, tint('#c9a070')); });
      ctx.strokeStyle = tint('#6b4128'); ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(cx + 16, cy - 8); ctx.lineTo(cx + 28, cy - 4); ctx.stroke();
      // flour sacks by the door
      [[382, 86], [390, 88], [386, 81]].forEach(([x, y]) => { fillRR(ctx, x - 5, y - 9, 10, 10, 3, tint('#efe3c6')); ctx.fillStyle = tint('#c9b48a'); ctx.fillRect(x - 3, y - 6, 6, 1.4); });
      break;
    }
    case 'cove': {
      // sand, surf and sea (original), plus beach life
      ctx.fillStyle = tint(winter ? '#e9e4da' : '#f0dcae'); ctx.fillRect(300, 40, R - 300, 50);
      ctx.fillStyle = tint('#6fb3d6'); ctx.fillRect(330, 62, R - 330, 28);
      ctx.fillStyle = 'rgba(255,255,255,0.6)'; for (let k = 0; k < 6; k++) ctx.fillRect(334 + ((k * 23 + t * 8) % 100), 64 + (k % 3) * 7, 9, 1.2);
      // foam line
      ctx.strokeStyle = 'rgba(255,255,255,0.8)'; ctx.lineWidth = 1.2; ctx.beginPath(); for (let x = 330; x < R; x += 4) ctx.lineTo(x, 62 + Math.sin(x * 0.2 + t * 2) * 1.2); ctx.stroke();
      // rowing boat on the water
      const bx = 392 + Math.sin(t * 0.5) * 8; const by = 74 + Math.sin(t * 1.2) * 0.8;
      ctx.fillStyle = tint('#8a5a3a'); ctx.beginPath(); ctx.moveTo(bx - 12, by); ctx.lineTo(bx + 12, by); ctx.lineTo(bx + 8, by + 5); ctx.lineTo(bx - 8, by + 5); ctx.closePath(); ctx.fill();
      ctx.fillStyle = tint('#fbf6ea'); ctx.beginPath(); ctx.moveTo(bx, by - 18); ctx.lineTo(bx, by - 1); ctx.lineTo(bx + 10, by - 1); ctx.closePath(); ctx.fill();
      // beach umbrella + towel
      ctx.strokeStyle = tint('#8a8577'); ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(410, 58); ctx.lineTo(414, 26); ctx.stroke();
      ctx.fillStyle = tint('#d9534f'); ctx.beginPath(); ctx.moveTo(398, 30); ctx.quadraticCurveTo(414, 14, 430, 26); ctx.closePath(); ctx.fill();
      ctx.fillStyle = tint('#fbf6ea'); ctx.beginPath(); ctx.moveTo(408, 26); ctx.quadraticCurveTo(414, 17, 419, 25); ctx.closePath(); ctx.fill();
      fillRR(ctx, 396, 52, 20, 6, 1, tint('#9ec5f0')); ctx.fillStyle = tint('#fbf6ea'); ctx.fillRect(396, 54, 20, 1.2);
      // sandcastle, bucket, shells and a crab
      ctx.fillStyle = tint('#e0c07e'); ctx.fillRect(344, 46, 14, 8); ctx.fillRect(341, 42, 5, 12); ctx.fillRect(356, 42, 5, 12); ctx.fillRect(348, 40, 6, 6);
      ctx.fillStyle = tint('#d9534f'); ctx.fillRect(351, 34, 0.8, 6); ctx.fillRect(351.8, 34, 4, 2.4);
      fillRR(ctx, 366, 48, 7, 7, 1, tint('#4f7cac')); ctx.strokeStyle = tint('#3a5a8c'); ctx.lineWidth = 0.6; ctx.beginPath(); ctx.arc(369.5, 48, 3.5, Math.PI, 0); ctx.stroke();
      [[374, 56, '#f7c9b6'], [342, 58, '#fbe7c6'], [428, 58, '#f2d7e8']].forEach(([x, y, c]) => { ctx.fillStyle = tint(c); ctx.beginPath(); ctx.moveTo(x, y - 3); ctx.lineTo(x - 3, y + 1); ctx.quadraticCurveTo(x, y + 2.5, x + 3, y + 1); ctx.closePath(); ctx.fill(); });
      { const cx = 380 + Math.sin(t * 0.7) * 8; ell(ctx, cx, 47, 3.4, 2.2, tint('#e0604a')); [-1, 1].forEach((d) => { circ(ctx, cx + d * 4.5, 45, 1.3, tint('#e0604a')); ctx.strokeStyle = tint('#e0604a'); ctx.lineWidth = 0.6; ctx.beginPath(); ctx.moveTo(cx + d * 2, 48); ctx.lineTo(cx + d * 4.5, 50); ctx.stroke(); }); circ(ctx, cx - 1, 45.5, 0.5, '#1d1b24'); circ(ctx, cx + 1, 45.5, 0.5, '#1d1b24'); }
      // seagrass on the dune
      ctx.strokeStyle = tint('#8aa05a'); ctx.lineWidth = 0.8; for (let k = 0; k < 8; k++) { const x = 302 + k * 4; ctx.beginPath(); ctx.moveTo(x, 42); ctx.quadraticCurveTo(x + Math.sin(t + k) * 2, 36, x + Math.sin(t + k) * 3, 32); ctx.stroke(); }
      break;
    }
    case 'pond': {
      // a lily pond with a little red bridge, stepping stones and lantern posts
      ell(ctx, 392, 58, 46, 18, tint(winter ? '#a9c9dc' : '#5f9fb8')); ell(ctx, 392, 57, 42, 15, tint(winter ? '#dcecf5' : '#79b8cf'));
      if (!winter) [[374, 56], [398, 64], [414, 52], [386, 50]].forEach(([x, y], k) => { ell(ctx, x, y, 6, 2.6, tint('#5e9c55')); ctx.fillStyle = tint('#79b8cf'); ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 6, y - 1); ctx.lineTo(x + 6, y + 1); ctx.fill(); if (k % 2 === 0) { circ(ctx, x - 1, y - 1.5, 1.8, tint('#f7a8c4')); circ(ctx, x - 1, y - 1.5, 0.7, tint('#ffe28a')); } });
      // bridge
      ctx.strokeStyle = tint('#c0392b'); ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(356, 64); ctx.quadraticCurveTo(372, 44, 388, 64); ctx.stroke();
      ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(356, 56); ctx.quadraticCurveTo(372, 36, 388, 56); ctx.stroke();
      for (let k = 0; k <= 4; k++) { const u = k / 4; const x = 356 + 32 * u; const y1 = 64 - Math.sin(u * Math.PI) * 14; ctx.beginPath(); ctx.moveTo(x, y1); ctx.lineTo(x, y1 - 8); ctx.stroke(); }
      // stepping stones from the path
      [[340, 78], [350, 84], [362, 80]].forEach(([x, y]) => ell(ctx, x, y, 5, 2.4, tint('#b9b3a8')));
      // lantern posts
      [346, 430].forEach((x) => { ctx.fillStyle = tint('#4a4a52'); ctx.fillRect(x - 1, 30, 2, 36); fillRR(ctx, x - 4, 22, 8, 9, 2, tint('#4a4a52')); circ(ctx, x, 26.5, 2.6, tod.dark > 0.3 ? '#ffd98a' : tint('#f0e6c8')); });
      // reeds
      ctx.strokeStyle = tint(season.key === 'autumn' || winter ? '#9a8a5a' : '#4f8a44'); ctx.lineWidth = 1;
      for (let k = 0; k < 7; k++) { const x = 420 + k * 3; ctx.beginPath(); ctx.moveTo(x, 66); ctx.lineTo(x + Math.sin(t * 1.3 + k) * 1.5, 44 - (k % 3) * 3); ctx.stroke(); }
      break;
    }
    case 'castle': {
      // cobbled courtyard with a fountain, topiary and banner poles
      const Rn = rng(71);
      ctx.fillStyle = tint('#b9b3c9'); ctx.beginPath(); ctx.ellipse(388, 58, 54, 26, 0, 0, Math.PI * 2); ctx.fill();
      for (let k = 0; k < 60; k++) { const a = Rn() * Math.PI * 2; const r = Math.sqrt(Rn()); ell(ctx, 388 + Math.cos(a) * 50 * r, 58 + Math.sin(a) * 23 * r, 3, 1.8, tint(Rn() < 0.5 ? '#a8a2b9' : '#c9c3d6')); }
      // fountain
      ell(ctx, 388, 62, 17, 6, tint('#8d8aa3')); ell(ctx, 388, 60, 14, 4.4, tint(winter ? '#dcecf5' : '#79b8cf'));
      ctx.fillStyle = tint('#8d8aa3'); ctx.fillRect(386, 42, 4, 18); ell(ctx, 388, 42, 7, 2.4, tint('#8d8aa3'));
      if (!winter) { ctx.strokeStyle = 'rgba(160,210,235,0.9)'; ctx.lineWidth = 1; [-1, 1].forEach((d) => { ctx.beginPath(); ctx.moveTo(388, 40); ctx.quadraticCurveTo(388 + d * 8, 30 + Math.sin(t * 6) * 0.6, 388 + d * 12, 58); ctx.stroke(); }); }
      // topiary
      [[346, 70, 'ball'], [430, 70, 'cone'], [352, 42, 'cone'], [426, 42, 'ball']].forEach(([x, y, k]) => {
        fillRR(ctx, x - 4, y - 5, 8, 6, 1.5, tint('#b5523b'));
        if (k === 'ball') { circ(ctx, x, y - 12, 7.5, tint(winter ? '#e8eef3' : '#4f8a44')); circ(ctx, x - 2, y - 14, 2.5, tint(winter ? '#ffffff' : '#6aa85a')); }
        else { ctx.fillStyle = tint(winter ? '#e8eef3' : '#4f8a44'); ctx.beginPath(); ctx.moveTo(x - 7, y - 4); ctx.lineTo(x, y - 26); ctx.lineTo(x + 7, y - 4); ctx.closePath(); ctx.fill(); }
      });
      // banner poles
      [330, 446].forEach((x, k) => { ctx.fillStyle = tint('#6d6a80'); ctx.fillRect(x - 1, 0, 2, 50); circ(ctx, x, -1, 2, tint('#e0b84f')); ctx.fillStyle = tint(k ? '#6d5fa3' : '#c0392b'); ctx.beginPath(); ctx.moveTo(x + 1, 4); ctx.lineTo(x + 12 + Math.sin(t * 2.5 + k) * 1.5, 7); ctx.lineTo(x + 12 + Math.sin(t * 2.5 + k) * 1.5, 22); ctx.lineTo(x + 6, 19); ctx.lineTo(x + 1, 22); ctx.closePath(); ctx.fill(); star(ctx, x + 6.5, 12, 2.2, '#f2d27a'); });
      break;
    }
    default: {
      // meadow (original hay bales + scarecrow) with a split-rail fence and a veggie patch
      [[320, 40], [352, 58], [390, 36]].forEach(([x, y]) => { ell(ctx, x, y, 13, 9, tint('#e8c465')); ctx.strokeStyle = tint('#c9a13e'); ctx.lineWidth = 0.7; ctx.beginPath(); ctx.ellipse(x, y, 9, 6, 0, 0, Math.PI * 2); ctx.stroke(); });
      drawScarecrow(ctx, 420, 40, t, tint);
      ctx.strokeStyle = tint('#9a6b45'); ctx.lineWidth = 1.6;
      for (let x = 344; x < R + 10; x += 26) { ctx.beginPath(); ctx.moveTo(x, 90); ctx.lineTo(x, 74); ctx.stroke(); }
      ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(340, 78); ctx.lineTo(R + 10, 78); ctx.moveTo(340, 85); ctx.lineTo(R + 10, 85); ctx.stroke();
      if (!winter) [[378, 70], [388, 70], [398, 70], [408, 70]].forEach(([x, y], k) => { ell(ctx, x, y, 4, 1.6, tint('#7a5236')); ell(ctx, x - 1.5, y - 3, 1.4, 3, tint('#6aa85a'), -0.4); ell(ctx, x + 1.5, y - 3, 1.4, 3, tint('#6aa85a'), 0.4); if (k % 2) circ(ctx, x, y - 1, 1.3, tint('#f28c28')); });
    }
  }
}

function drawScarecrow(ctx, x, y, t, tint) {
  ctx.fillStyle = tint('#7a4b2e'); ctx.fillRect(x - 1, y - 30, 2.4, 34); ctx.fillRect(x - 12, y - 22, 24, 2);
  fillRR(ctx, x - 7, y - 24, 14, 14, 3, tint('#c0504d'));
  circ(ctx, x, y - 30, 5, tint('#e8c465'));
  ell(ctx, x, y - 34, 9, 2, tint('#9c7b4f')); ctx.fillStyle = tint('#9c7b4f'); ctx.fillRect(x - 4, y - 40, 8, 6);
  void t;
}

