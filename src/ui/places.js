// Screens for the bigger world: moving to a new site, the wings, the Deep Stacks and the Chronicle.
// Mixed into Screens (see screens.js), so `this` is the Screens instance.
import { openModal, closeModal } from './modals.js';
import { h, toast, bigText, haptic } from './dom.js';
import { ROOMS } from '../data/rooms.js';
import { FURNITURE } from '../data/furniture.js';
import { WING, WINGS, WING_MAX, WING_PER_LVL, WING_DECOR_BONUS, STOREY_LVL, wingMult } from '../data/wings.js';
import { todaysGazette } from '../data/gazette.js';
import { HALLS, FOSSILS, CHRONICLE, HALL_BONUS, FOSSIL_BONUS, CREW_CHEESE, DEEP_ROWS, cellKind, cellId, FOSSIL_AT, digTimeSec, restoreTimeSec } from '../data/deep.js';
import {
  BIZ, BIZ_BY_ID, BIZ_MAX, BIZ_PER_LVL, BIZ_MILESTONES, BIZ_MILESTONE_BONUS, BIZ_FIXTURE_BONUS, HALL_MAX, HALL_PER_LVL, LIFT_ROWS, LIFT_STOP_BONUS, bizBonus, bizTier,
} from '../data/mole.js';
import { branchInfo } from '../data/branches.js';
import * as E from '../core/economy.js';
import { fmt, fmtTime } from '../core/format.js';
import { sfx } from '../audio/sfx.js';
import { Ads } from '../ads/ads.js';

const SCENE_BG = {
  meadow: 'linear-gradient(135deg,#8cc56f,#e8c465)', windmill: 'linear-gradient(135deg,#9ec5f0,#e8cf7a)',
  cove: 'linear-gradient(135deg,#4f8fd9,#8fd3c7)', pond: 'linear-gradient(135deg,#5e9c55,#79b8cf)', castle: 'linear-gradient(135deg,#4b3f78,#b27fa0)',
};
const pct = (x) => `${Math.round(x * 100)}%`;
const UMBER_LINES = [
  '“Again. The one with the socks.”',
  '“I like the part where the baker hums. Read that part twice.”',
  '“Thessaly used to do a voice for the King. It was a very silly voice.”',
  '“Four hundred years, and I still don’t know how that ballad ends. Don’t tell me. Read it.”',
  '“Is it Tuesday? Rattigan does the voices on Tuesdays.”',
  '“Mm. Your library upstairs sounds busy tonight. Good.”',
];

// Live-updating modal body: `render` is called now and every 250 ms while the modal is open.
function live(body, render) {
  let iv = null;
  return {
    onOpen: (hd) => { render(hd); iv = setInterval(() => render(hd), 250); },
    onClose: () => clearInterval(iv),
  };
}

export const placeScreens = {
  /* ================= moving ================= */
  move() {
    const g = this.game; const s = g.s;
    const cur = g.branch(); const next = g.nextBranch();
    const local = FURNITURE.filter((f) => f.branch === next.id).map((f) => `${f.icon} ${f.name}`).join(', ');
    const body = h('<div data-move></div>');
    const render = (hd) => {
      const block = g.landBlocker(); const rem = g.moveRemaining(); const ready = g.moveReady();
      const need = Math.min(cur.floors, ROOMS.length);
      let status = '';
      if (block === 'floors') status = `<div class="muted warn">Build all ${need} floors this site can hold first (${g.builtCount()}/${need}).</div>`;
      else if (block === 'coins') status = `<div class="muted warn">You need ${fmt(g.moveCost() - s.coins)} more coins for the land.</div>`;
      else if (block === 'bought' && !ready) status = `<div class="big-reward" style="font-size:20px">⏳ ${fmtTime(rem)}</div><div class="muted">The movers are getting ${next.name} ready. Your library keeps running meanwhile.</div>`;
      else if (ready) status = '<div class="big-reward" style="font-size:20px">📦 All packed!</div><div class="muted">The new site is ready. Move in whenever you like.</div>';
      const html = `<div class="branch-card" style="background:${SCENE_BG[cur.scene]}"><b>Now: ${cur.name}</b><div>🏛️ ${Math.min(g.builtCount(), cur.floors)}/${cur.floors} floors · 🏠 ${cur.plots} wing plot${cur.plots === 1 ? '' : 's'} · bonus ×${cur.mult}</div></div>
        <div class="art" style="font-size:34px;margin:2px 0">🚚</div>
        <div class="branch-card" style="background:${SCENE_BG[next.scene]}"><b>Next: ${next.name}</b><div>${next.blurb}</div><div>🏠 ${next.building}</div>
          <div class="site-gains"><span>🏛️ ${next.floors} floors${next.floors > cur.floors ? ` <b>+${next.floors - cur.floors}</b>` : ''}</span><span>🏠 ${next.plots} wing plots${next.plots > cur.plots ? ` <b>+${next.plots - cur.plots}</b>` : ''}</span><span>✨ bonus ×${next.mult}</span></div></div>
        <div class="flavor" style="margin-top:8px">Everything comes with you: every floor and its levels, the wings, books, furniture and cheese. You pay for the land, and get <b>+${g.pendingQuills()} Golden Quills</b> for what you earned here.</div>
        ${local ? `<div class="muted">New in the ${next.name} shop: ${local}.</div>` : ''}
        <div class="move-cost"><span class="ico ico-coin"></span>${fmt(next.cost)} <small>· movers need ${fmtTime(next.prep)}</small></div>
        ${status}`;
      if (body.dataset.html !== html) { body.dataset.html = html; body.innerHTML = html; }
      if (hd) {
        const btns = hd.el.querySelectorAll('.modal-btns .btn');
        btns.forEach((b) => { if (b.dataset.k === 'buy') b.disabled = !!block; if (b.dataset.k === 'in') b.disabled = !ready; if (b.dataset.k === 'speed' || b.dataset.k === 'cheese') b.style.display = block === 'bought' && !ready ? '' : 'none'; });
        const c = hd.el.querySelector('[data-mc]'); if (c) c.textContent = g.cheeseToMove();
      }
    };
    const buttons = [];
    if (!s.move.end) buttons.push({ label: `Buy the land <span class="ico ico-coin"></span> ${fmt(next.cost)}`, cls: 'gold', onClick: () => { if (!g.buyLand()) { sfx.error(); toast('Not yet!'); return false; } sfx.buy(); haptic('medium'); bigText('Land bought!'); toast(`🚚 The movers are on their way to ${next.name}!`, 'gold'); return true; } });
    else {
      buttons.push({ ...this.adBtn('Help the movers <small>halve the wait</small>', 'move_speedup', () => { g.speedMove(); toast('⏩ The movers are working double time!', 'gold'); }), keepOpen: true, stayDisabled: false });
      buttons.push({ label: 'Finish now <span class="ico ico-cheese"></span> <span data-mc></span>', cls: 'gold', keepOpen: true, onClick: () => { if (!g.finishMoveCheese()) { sfx.error(); toast('Not enough golden cheese 🧀'); } } });
      buttons.push({ label: `Move in! 🏡`, cls: 'gold', onClick: () => { this.ui.doPrestige(); } });
    }
    const lv = live(body, render);
    openModal({
      title: '🚚 A Bigger Library', wide: true, body, buttons,
      onOpen: (hd) => { hd.el.querySelectorAll('.modal-btns .btn').forEach((b, k) => { b.dataset.k = !s.move.end ? 'buy' : ['speed', 'cheese', 'in'][k]; }); lv.onOpen(hd); },
      onClose: lv.onClose,
    });
  },

  arrival(res) {
    const g = this.game; const to = res.to;
    const gift = 10 + 5 * Math.min(8, g.s.branch);
    const local = FURNITURE.filter((f) => f.branch === to.id);
    const news = [res.newFloors ? `🏛️ room for <b>${res.newFloors} more floor${res.newFloors > 1 ? 's' : ''}</b>` : '', res.newPlots ? `🏠 <b>${res.newPlots} new wing plot${res.newPlots > 1 ? 's' : ''}</b> beside the library` : ''].filter(Boolean).join(' and ');
    openModal({
      title: `🧳 Welcome to ${to.name}!`,
      body: `<div class="art">${to.art || '🏡🐭'}</div>
        <div class="flavor">${to.building} The movers carried all <b>${res.floors} floors</b> across: levels, chairs, shelves, wings and paintings included.</div>
        ${news ? `<div class="flavor">New here: ${news}.</div>` : ''}
        <div class="big-reward"><span class="ico ico-quill"></span>+${res.gained} Golden Quills</div>
        <div class="muted">Branch bonus now ×${to.mult}.${local.length ? `<br>The local shop sells ${local.map((f) => `${f.icon} ${f.name}`).join(' and ')}.` : ''}</div>`,
      buttons: [
        this.adBtn(`Housewarming party! <small>+${gift} golden cheese</small>`, 'housewarming', () => { g.addCheese(gift); this.celebrate([{ kind: 'cheese', amount: gift }]); toast('What a party! Every neighbour brought cheese. 🧀', 'gold'); }),
        { label: 'Let’s read!', cls: 'plain', onClick: () => sfx.fanfare() },
      ],
    });
  },

  /* ================= wings ================= */
  wing(id) {
    const g = this.game; const s = g.s; const w = WING[id]; const st = g.wing(id);
    if (!g.wingOpen(id)) {
      let site = 'a bigger site';
      for (let i = s.branch + 1; i < s.branch + 12; i++) if (branchInfo(i).plots > w.plot) { site = branchInfo(i).name; break; }
      openModal({
        title: `${w.icon} ${w.name}`,
        body: `<div class="art">🏗️🔒</div><div class="flavor">${w.blurb}</div><div class="muted">This plot opens when your library moves to <b>${site}</b>.</div>`,
        buttons: [{ label: '🚚 Moving plans', cls: 'gold', onClick: () => { setTimeout(() => this.move(), 200); } }],
      });
      return;
    }
    if (!st.built && !st.buildEnd) {
      const can = s.coins >= w.unlock; const busy = g.wingBuilding();
      openModal({
        title: `${w.icon} New Wing`,
        body: `<div class="art">🏗️${w.icon}</div><div style="font-size:20px;font-weight:700">${w.name}</div>
          <div class="flavor">${w.blurb}</div>
          <div class="wing-perks"><div>📈 Every level: <b>+${Math.round(WING_PER_LVL * 100)}% income</b> for the whole library</div><div>${w.action.icon} ${w.action.label}${w.action.every ? ` every ${fmtTime(w.action.every)}` : ''}</div></div>
          <div class="muted">Build time: ${fmtTime(w.build)}</div>
          ${busy ? `<div class="muted warn">The builders are busy on the ${WING[busy].short}.</div>` : can ? '' : `<div class="muted warn">You need ${fmt(w.unlock - s.coins)} more coins.</div>`}`,
        buttons: [{ label: `Build <span class="ico ico-coin"></span> ${fmt(w.unlock)}`, disabled: !can || !!busy, onClick: () => { if (!g.startWing(id)) { sfx.error(); return false; } sfx.hammer(); haptic('medium'); this.ui.panToWing(id); return true; } }],
      });
      return;
    }
    if (!st.built) {
      const body = h(`<div><div class="art">🔨${w.icon}</div><div style="font-size:19px;font-weight:700">${w.name}</div><div class="flavor">The builder mice are putting up the walls!</div><div class="big-reward" data-t>--</div></div>`);
      openModal({
        title: 'Under Construction', body,
        buttons: [
          { ...this.adBtn('Speed up', 'wing_speedup', () => { g.speedWing(id); toast('Build time halved! ⏩', 'gold'); }), keepOpen: true },
          { label: 'Finish now <span class="ico ico-cheese"></span> <span data-c></span>', cls: 'gold', onClick: () => { const c = Math.max(1, Math.ceil(g.wingRemaining(id) / 120)); if (!g.spendCheese(c)) { toast('Not enough golden cheese'); sfx.error(); return false; } st.buildEnd = Date.now(); return true; } },
        ],
        ...live(body, (hd) => {
          if (st.built) { closeModal(); return; }
          body.querySelector('[data-t]').textContent = `⏳ ${fmtTime(g.wingRemaining(id))}`;
          const c = hd?.el.querySelector('[data-c]'); if (c) c.textContent = Math.max(1, Math.ceil(g.wingRemaining(id) / 120));
        }),
      });
      return;
    }
    // a working wing: levels and its special action
    let mode = 1;
    let ftab = 0; // which storey's furniture is shown
    const fixtures = () => (ftab === 0 ? w.decor : w.upper[ftab - 1].fixtures);
    const owned = (k) => (ftab === 0 ? st.decor[k] : st.up[ftab - 1][k]);
    const fcost = (k) => (ftab === 0 ? g.wingDecorCost(id, k) : g.wingUpperCost(id, ftab - 1, k));
    const storeyOpen = () => ftab === 0 || st.lvl >= STOREY_LVL[ftab];
    const body = h(`<div class="wing-sheet">
      <div class="ws-head"><span class="ws-ico">${w.icon}</span><div><b>${w.name}</b><small data-lv></small></div></div>
      <div class="stats"><div><b data-bonus></b><small>library income</small></div><div><b data-next></b><small>next level</small></div><div><b data-floors></b><small>storeys</small></div></div>
      <div class="buy-mode"><button data-m="1">×1</button><button data-m="10">×10</button><button data-m="max">MAX</button></div>
      <button class="btn gold wide-btn" data-up></button>
      <div class="section-title">${w.action.icon} ${w.action.label}</div>
      <div class="ws-action" data-act></div>
      ${id === 'press' ? '<button class="btn plain wide-btn" data-gazette style="margin-top:8px">📰 Read today’s Gazette</button>' : ''}
      <div class="section-title">Furniture <small>each +${Math.round(WING_DECOR_BONUS * 100)}% library income</small></div>
      <div class="tabs" data-ftabs>${[['🏠', 'Ground floor'], [w.upper[0].icon, w.upper[0].name], [w.upper[1].icon, w.upper[1].name]].map(([ic, nm], j) => `<button data-ft="${j}">${ic} ${nm}</button>`).join('')}</div>
      <div class="decor-grid" data-decor>${[0, 1, 2, 3, 4].map((k) => `<button class="decor" data-wd="${k}"><span class="d-ico" data-wdi="${k}"></span><span class="d-name" data-wdn="${k}"></span><span class="d-cost" data-wdc="${k}"></span></button>`).join('')}</div>
      <div class="muted" data-wddesc style="margin-top:6px">${w.blurb}</div>
    </div>`);
    const count = () => (mode === 'max' ? Math.max(1, g.wingMaxLevels(id)) : Math.min(mode, WING_MAX - st.lvl));
    let lastAct = '';
    const render = () => {
      body.querySelector('[data-lv]').textContent = `Level ${st.lvl} / ${WING_MAX}`;
      body.querySelector('[data-bonus]').textContent = `+${pct(wingMult(st.lvl))}`;
      body.querySelector('[data-next]').textContent = st.lvl >= WING_MAX ? 'MAX' : `+${pct(wingMult(st.lvl + 1) - wingMult(st.lvl))}`;
      const ns = st.lvl >= STOREY_LVL[2] ? 3 : st.lvl >= STOREY_LVL[1] ? 2 : 1;
      body.querySelector('[data-floors]').textContent = ns === 3 ? '3' : `${ns} → ${ns + 1} at Lv ${STOREY_LVL[ns]}`;
      body.querySelectorAll('[data-m]').forEach((b) => b.classList.toggle('on', String(mode) === b.dataset.m));
      const up = body.querySelector('[data-up]'); const n = count(); const cost = g.wingCost(id, n);
      up.innerHTML = st.lvl >= WING_MAX ? 'Fully upgraded ✨' : `Upgrade ×${n} <span class="ico ico-coin"></span> ${fmt(cost)}`;
      up.disabled = st.lvl >= WING_MAX || cost > s.coins;
      body.querySelectorAll('[data-ft]').forEach((b) => { const j = +b.dataset.ft; b.classList.toggle('on', j === ftab); b.classList.toggle('locked', j > 0 && st.lvl < STOREY_LVL[j]); });
      fixtures().forEach((d, k) => {
        const btn = body.querySelector(`[data-wd="${k}"]`); const c = fcost(k); const have = owned(k); const open = storeyOpen();
        btn.classList.toggle('owned', !!have); btn.classList.toggle('can', !have && open && c <= s.coins); btn.classList.toggle('locked', !open);
        btn.title = d.desc;
        const ic = body.querySelector(`[data-wdi="${k}"]`); if (ic.textContent !== d.icon) ic.textContent = d.icon;
        const nm = body.querySelector(`[data-wdn="${k}"]`); if (nm.textContent !== d.name) nm.textContent = d.name;
        const html = have ? '✓ in place' : !open ? `🔒 Lv ${STOREY_LVL[ftab]}` : `<span class="ico ico-coin"></span>${fmt(c)}`;
        const el = body.querySelector(`[data-wdc="${k}"]`); if (el.innerHTML !== html) el.innerHTML = html;
      });
      // action
      const state = g.wingActionState(id); const left = g.wingActionLeft(id);
      let act = '';
      if (id === 'hall') {
        const club = g.todaysClub();
        act = state === 'running' ? `<div>${club.icon} <b>${club.name}</b> is on! Income ×1.5 · ${fmtTime(left)} left</div><div class="muted">${club.line}</div>`
          : state === 'ready' ? `<div>Tonight: ${club.icon} <b>${club.name}</b></div><div class="muted">${club.line} Income ×1.5 for ${fmtTime(w.action.run)}, then cheese and reputation.</div><button class="btn gold" data-do>Host it!</button>`
            : `<div class="muted">The hall is being tidied up. Next club night in ${fmtTime(left)}.</div>`;
      } else if (id === 'press') {
        act = state === 'running' ? `<div>🖨️ Printing… <b>${fmtTime(left)}</b></div><button class="btn ad" data-rush>📺 Finish now</button>`
          : state === 'done' ? '<div>📕 A fresh book is off the press!</div><button class="btn gold" data-do>Collect the book</button>'
            : `<div class="muted">Every print run makes a book for your album (${fmtTime(w.action.run)}).</div><button class="btn gold" data-do>Start a print run</button>`;
      } else {
        act = state === 'ready' ? `<div>${w.action.text}</div><button class="btn gold" data-do>${w.action.label} <span class="ico ico-coin"></span> ${fmt(g.wingReward(id))}</button>`
          : `<div class="muted">Next one in ${fmtTime(left)}. Worth ${fmt(g.wingReward(id))} coins.</div>`;
      }
      if (act !== lastAct) {
        lastAct = act; const box = body.querySelector('[data-act]'); box.innerHTML = act;
        box.querySelector('[data-do]')?.addEventListener('click', () => { this.ui.wingTap(id, 'bubble'); });
        box.querySelector('[data-rush]')?.addEventListener('click', async (e) => { e.target.disabled = true; if (await Ads.rewarded('press_rush')) { s.stats.adsWatched++; g.rushWing(id); } lastAct = ''; });
      }
    };
    body.querySelectorAll('[data-m]').forEach((b) => b.addEventListener('click', () => { sfx.tap(); mode = b.dataset.m === 'max' ? 'max' : +b.dataset.m; render(); }));
    body.querySelector('[data-gazette]')?.addEventListener('click', () => { sfx.open(); this.gazette(); });
    body.querySelectorAll('[data-ft]').forEach((b) => b.addEventListener('click', () => { sfx.tap(); ftab = +b.dataset.ft; body.querySelector('[data-wddesc]').textContent = ftab === 0 ? w.blurb : storeyOpen() ? `${w.upper[ftab - 1].icon} ${w.upper[ftab - 1].name}: the wing's ${ftab === 1 ? 'second' : 'third'} storey.` : `The ${w.upper[ftab - 1].name} opens when the ${w.short} reaches Lv ${STOREY_LVL[ftab]}.`; render(); }));
    body.querySelectorAll('[data-wd]').forEach((b) => b.addEventListener('click', () => {
      const k = +b.dataset.wd; const d = fixtures()[k];
      body.querySelector('[data-wddesc]').textContent = `${d.icon} ${d.name}: ${d.desc}`;
      if (owned(k)) { sfx.tap(); return; }
      if (!storeyOpen()) { sfx.error(); toast(`🔒 Opens when the ${w.short} reaches Lv ${STOREY_LVL[ftab]}`); return; }
      const ok = ftab === 0 ? g.buyWingDecor(id, k) : g.buyWingUpper(id, ftab - 1, k);
      if (ok) { sfx.buy(); sfx.sparkle(); haptic('medium'); toast(`${d.icon} ${d.name} is in! +${Math.round(WING_DECOR_BONUS * 100)}% income`, 'gold'); if (ftab > 0) this.ui.panToWing(id); }
      else { sfx.error(); b.animate([{ transform: 'translateX(-4px)' }, { transform: 'translateX(4px)' }, { transform: 'none' }], 200); }
      render();
    }));
    body.querySelector('[data-up]').addEventListener('click', () => {
      const lvl = st.lvl;
      if (g.buyWing(id, count())) {
        sfx.buy(); haptic('light');
        const grew = STOREY_LVL.findIndex((L, j) => j > 0 && lvl < L && st.lvl >= L);
        if (grew > 0) { sfx.fanfare(); bigText(grew === 1 ? 'A second storey!' : 'A third storey!'); toast(`🏗️ The ${w.short} has a new ${w.upper[grew - 1].name}! Furnish it from the Furniture tabs.`, 'gold'); ftab = grew; this.ui.panToWing(id); }
      }
      else sfx.error();
      render();
    });
    openModal({ title: `${w.icon} ${w.short}`, body, wide: true, ...live(body, render) });
  },

  /* ================= the Deep Stacks ================= */
  deep() {
    const g = this.game; const s = g.s; const d = s.deep;
    const body = h('<div class="deep-sheet"></div>');
    let last = '';
    const render = () => {
      const halls = Object.entries(HALLS).map(([n, hl]) => {
        const st = g.hallStage(+n);
        return `<div class="deep-hall ${st >= 3 ? 'done' : ''}"><span>${st >= 3 ? '✨' : st > 0 ? '🔨' : '·'}</span><b>${hl.name.replace('The ', '')}</b><i class="dh-bar"><em style="width:${(st / 3) * 100}%"></em></i></div>`;
      }).join('');
      const jobs = d.jobs.map((j) => `<div class="deep-job"><span>${j.kind === 'dig' ? '⛏️ Digging' : `🔨 ${HALLS[j.hall].steps[j.step]}`}</span><b>${fmtTime(g.jobRemaining(j))}</b></div>`).join('') || '<div class="muted">The crew is resting. Tap a glowing spot underground to dig!</div>';
      const fossils = FOSSILS.map((f) => `<span class="fossil-chip ${d.fossils[f.id] ? 'got' : ''}" title="${f.name}">${d.fossils[f.id] ? f.icon : '?'}</span>`).join('');
      const bonus = E.deepMult(s);
      const html = `<div class="bonus-line">⛏️ Income from the Deep Stacks: <b>×${bonus.toFixed(2)}</b></div>
        <div class="section-title">Library halls <small>${g.hallsDone()}/8 restored · +${Math.round(HALL_BONUS * 100)}% each</small></div><div class="deep-halls">${halls}</div>
        <div class="section-title">Fossils <small>+${Math.round(FOSSIL_BONUS * 100)}% each</small></div><div class="fossil-row">${fossils}</div>
        <div class="section-title">Mole crews <small>${d.crews} crew${d.crews > 1 ? 's' : ''}</small></div>${jobs}
        ${d.crews < 2 ? `<div class="shop-item"><div class="si-ico">🐾</div><div class="si-body"><b>Hire a second crew</b><div>Dig or repair two things at once</div></div><span class="btn-stack"><button class="btn gold" data-crew><span class="ico ico-cheese"></span>${CREW_CHEESE}</button><button class="btn ad" data-crewad>📺 ${g.adBuyProgress('crew')}/${g.adsFor(CREW_CHEESE)}</button></span></div>` : ''}
        ${d.tales ? `<div class="bonus-line">📖 The Mighty Tales: <b>×2 income</b> forever</div>` : ''}
        ${this.moleCitySection()}`;
      if (html === last) return;
      last = html; body.innerHTML = html;
      body.querySelector('[data-lift]')?.addEventListener('click', () => { sfx.open(); this.lift(); });
      body.querySelectorAll('[data-biz]').forEach((b) => b.addEventListener('click', () => {
        const id = b.dataset.biz;
        if (g.biz(id)) { sfx.open(); this.biz(id); return; }
        sfx.tap();
        const blk = g.bizBlocker(id);
        toast(blk === 'halls' ? `🔒 ${BIZ_BY_ID[id].name} opens when ${BIZ_BY_ID[id].halls} halls are restored.` : blk === 'lift' ? '🛗 Build the Grand Lift first!' : '🏪 Tap an empty tunnel with a TO LET sign to open it there!');
        if (!blk) { closeModal(); this.ui.panToDeep(); }
      }));
      body.querySelector('[data-crew]')?.addEventListener('click', () => { if (g.hireCrew()) { sfx.buy(); toast('🐾 A second mole crew joins the dig!', 'gold'); last = ''; } else { sfx.error(); toast('Not enough golden cheese 🧀'); } });
      body.querySelector('[data-crewad]')?.addEventListener('click', async (e) => {
        if (!g.offerReady('adbuy', 30)) { toast('That’s plenty of ads for today. Come back tomorrow!'); return; }
        e.target.disabled = true;
        if (await Ads.rewarded('shop_adbuy')) { s.stats.adsWatched++; g.useOffer('adbuy'); if (g.adBuyStep('crew', CREW_CHEESE)) { g.hireCrew(true); toast('🐾 A second mole crew joins the dig!', 'gold'); } }
        last = '';
      });
    };
    openModal({
      title: '⛏️ The Deep Stacks', wide: true, body,
      buttons: [
        { label: `📜 Chronicle <small>${g.chroniclePages()} page${g.chroniclePages() === 1 ? '' : 's'}</small>`, cls: 'plain', onClick: () => { setTimeout(() => this.chronicle(g.chroniclePages() - 1), 200); } },
        { label: 'Take me down ⬇️', cls: 'gold', onClick: () => { this.ui.panToDeep(); } },
      ],
      row: true,
      ...live(body, render),
    });
  },

  /* ================= Mole City ================= */
  lift() {
    const g = this.game; const s = g.s; const d = s.deep;
    const body = h('<div class="deep-sheet"></div>');
    let last = '';
    const render = () => {
      const blk = g.liftBlocker(); const cost = g.liftCost(); const nr = g.liftNextRow();
      const stops = [`<div class="lift-stop done"><span>🏡</span><b>The Garden</b><small>lift house</small></div>`, `<div class="lift-stop done"><span>🏦</span><b>The Vault</b><small>under the lawn</small></div>`, ...LIFT_ROWS.map((r, i) => `<div class="lift-stop ${i < d.lift ? 'done' : i === d.lift ? 'next' : ''}"><span>${i < d.lift ? '🛗' : i === d.lift ? '👉' : '·'}</span><b>${r === DEEP_ROWS - 1 ? 'Umber’s Hoard' : `Level ${r + 1}`}</b><small>${(r + 1) * 20} paces</small></div>`)].join('');
      const status = blk === 'city' ? 'The moles haven’t moved in yet. Restore the first library hall.'
        : blk === 'done' ? 'The lift runs all the way down to Umber. Every stop is open!'
          : blk === 'dig' ? `Dig a tunnel at level ${nr + 1}, right beside the shaft, for the next stop.`
            : blk === 'door' ? 'The last stop is behind the great door.' : '';
      const html = `<div class="flavor">A brass cage on a very long cable, from the lift house on the lawn all the way down. Mice and hamsters ride down to shop in Mole City; moles ride up to borrow books.</div>
        <div class="bonus-line">Every stop: <b>+${pct(LIFT_STOP_BONUS)}</b> library income · now <b>+${pct(LIFT_STOP_BONUS * d.lift)}</b></div>
        <div class="lift-stops">${stops}</div>
        ${status ? `<div class="muted ${blk === 'done' ? '' : 'warn'}">${status}</div>` : ''}
        ${!blk ? `<button class="btn gold wide-btn" data-buy ${cost > s.coins ? 'disabled' : ''}>${d.lift ? 'Open the next stop' : 'Build the Grand Lift'} <span class="ico ico-coin"></span> ${fmt(cost)}</button>` : ''}`;
      if (html === last) return;
      last = html; body.innerHTML = html;
      body.querySelector('[data-buy]')?.addEventListener('click', () => {
        if (!g.buyLiftStop()) { sfx.error(); return; }
        sfx.buy(); sfx.fanfare(); haptic('medium');
        bigText(d.lift === 1 ? 'The Grand Lift!' : 'New lift stop!');
        toast(d.lift === 1 ? '🛗 Ding! The Grand Lift is running. Tap an empty tunnel with a TO LET sign to open a mole shop!' : `🛗 The lift now stops at level ${LIFT_ROWS[d.lift - 1] + 1}. +${pct(LIFT_STOP_BONUS)} income`, 'gold');
        last = ''; render();
      });
    };
    openModal({ title: '🛗 The Grand Lift', wide: true, body, replace: true, ...live(body, render) });
  },

  // Choose which mole business opens in an empty tunnel.
  bizPick(c, r) {
    const g = this.game; const s = g.s;
    if (!s.deep.lift) {
      openModal({
        title: '🏪 Mole City',
        body: '<div class="art">🛗🐾</div><div class="flavor">“Lovely tunnel for a shop,” says Mrs Burrow. “But nobody will come all the way down here without a lift.”</div><div class="muted">Build the Grand Lift in the vault first.</div>',
        buttons: [{ label: '🛗 The Grand Lift', cls: 'gold', onClick: () => { setTimeout(() => this.lift(), 200); } }],
      });
      return;
    }
    const body = h('<div class="biz-pick"></div>');
    let last = '';
    const render = () => {
      const html = BIZ.map((b) => {
        const blk = g.bizBlocker(b.id); const st = g.biz(b.id); const cost = g.bizBuildCost(b.id);
        const btn = blk === 'open' ? `<button class="btn plain" data-see="${b.id}">${st.built ? `Lv ${st.lvl}` : '🔨'}</button>`
          : blk === 'halls' ? `<button class="btn" disabled>🔒 ${b.halls} halls</button>`
            : `<button class="btn gold" data-open="${b.id}" ${cost > s.coins ? 'disabled' : ''}><span class="ico ico-coin"></span>${fmt(cost)}</button>`;
        return `<div class="shop-item ${blk === 'halls' ? 'locked' : ''}"><div class="si-ico">${b.icon}</div><div class="si-body"><b>${b.name}</b><div>${blk === 'halls' ? `Opens when ${b.halls} library halls are restored.` : blk === 'open' ? (st.built ? 'Already open in another tunnel.' : 'Being built in another tunnel.') : `${b.blurb} <i>${fmtTime(b.build)} to build.</i>`}</div></div>${btn}</div>`;
      }).join('');
      if (html === last) return;
      last = html; body.innerHTML = `<div class="flavor" style="margin-bottom:8px">Which mole business should open in this tunnel? Every shop earns the whole library more as it levels up.</div>${html}`;
      body.querySelectorAll('[data-open]').forEach((b) => b.addEventListener('click', () => {
        const id = b.dataset.open;
        if (!g.buildBiz(id, c, r)) { sfx.error(); toast('Not enough coins yet!'); return; }
        sfx.hammer(); haptic('medium'); closeModal();
        toast(`🔨 The moles are fitting out ${BIZ_BY_ID[id].name}!`, 'gold');
        this.ui.panToCell(c, r);
      }));
      body.querySelectorAll('[data-see]').forEach((b) => b.addEventListener('click', () => { sfx.tap(); this.biz(b.dataset.see); }));
    };
    openModal({ title: '🏪 Open a Mole Shop', wide: true, body, ...live(body, render) });
  },

  // A mole business: construction, levels and fixtures.
  biz(id) {
    const g = this.game; const s = g.s; const b = BIZ_BY_ID[id]; const st = g.biz(id);
    if (!st) return;
    if (!st.built) {
      const body = h(`<div><div class="art">🔨${b.icon}</div><div style="font-size:19px;font-weight:700">${b.name}</div><div class="flavor">The moles are painting the walls and polishing the counter.</div><div class="big-reward" data-t>--</div></div>`);
      openModal({
        title: 'Opening Soon', body, replace: true,
        buttons: [
          { ...this.adBtn('Help the moles', 'biz_speedup', () => { g.speedBiz(id); toast('⏩ The moles are working double time!', 'gold'); }), keepOpen: true },
          { label: 'Open now <span class="ico ico-cheese"></span> <span data-c></span>', cls: 'gold', onClick: () => { if (!g.finishBizCheese(id)) { toast('Not enough golden cheese'); sfx.error(); return false; } return true; } },
        ],
        ...live(body, (hd) => {
          if (st.built) { closeModal(); return; }
          body.querySelector('[data-t]').textContent = `⏳ ${fmtTime(g.bizRemaining(id))}`;
          const cc = hd?.el.querySelector('[data-c]'); if (cc) cc.textContent = g.cheeseForBiz(id);
        }),
      });
      return;
    }
    let mode = 1;
    const body = h(`<div class="wing-sheet">
      <div class="ws-head"><span class="ws-ico">${b.icon}</span><div><b>${b.name}</b><small data-lv></small></div></div>
      <div class="flavor" style="margin:2px 0 8px">${b.blurb}</div>
      <div class="stats"><div><b data-bonus></b><small>library income</small></div><div><b data-next></b><small>next level</small></div><div><b data-cust></b><small>customers</small></div></div>
      <div class="buy-mode"><button data-m="1">×1</button><button data-m="10">×10</button><button data-m="max">MAX</button></div>
      <button class="btn gold wide-btn" data-up></button>
      <div class="muted" data-mile style="margin-top:6px"></div>
      <div class="section-title">Fixtures <small>each +${pct(BIZ_FIXTURE_BONUS)} library income</small></div>
      <div class="decor-grid four">${b.fixtures.map((f, k) => `<button class="decor" data-fx="${k}"><span class="d-ico">${f.icon}</span><span class="d-name">${f.name}</span><span class="d-cost" data-fxc="${k}"></span></button>`).join('')}</div>
      <div class="muted" data-desc style="margin-top:6px">Tap a fixture to see what it does.</div>
    </div>`);
    const count = () => (mode === 'max' ? Math.max(1, g.bizMaxLevels(id)) : Math.min(mode, BIZ_MAX - st.lvl));
    const render = () => {
      const tier = bizTier(st.lvl);
      body.querySelector('[data-lv]').textContent = `Level ${st.lvl} / ${BIZ_MAX} · Mole City`;
      body.querySelector('[data-bonus]').textContent = `+${pct(bizBonus(st))}`;
      const nextM = BIZ_MILESTONES.find((m) => m > st.lvl);
      body.querySelector('[data-next]').textContent = st.lvl >= BIZ_MAX ? 'MAX' : `+${pct(BIZ_PER_LVL + (nextM === st.lvl + 1 ? BIZ_MILESTONE_BONUS : 0))}`;
      body.querySelector('[data-cust]').textContent = `${Math.min(3, tier)}`;
      body.querySelector('[data-mile]').textContent = nextM ? `At Lv ${nextM}: +${pct(BIZ_MILESTONE_BONUS)} more${nextM < 50 ? ', a busier shop and new décor' : ' and a golden sign'}.` : '✨ Fully upgraded. A golden sign for the best shop under the meadow!';
      body.querySelectorAll('[data-m]').forEach((x) => x.classList.toggle('on', String(mode) === x.dataset.m));
      const up = body.querySelector('[data-up]'); const n = count(); const cost = g.bizLevelCost(id, n);
      up.innerHTML = st.lvl >= BIZ_MAX ? 'Fully upgraded ✨' : `Upgrade ×${n} <span class="ico ico-coin"></span> ${fmt(cost)}`;
      up.disabled = st.lvl >= BIZ_MAX || cost > s.coins;
      b.fixtures.forEach((f, k) => {
        const btn = body.querySelector(`[data-fx="${k}"]`); const c = g.bizFixtureCost(id, k); const have = st.fx[k];
        btn.classList.toggle('owned', have); btn.classList.toggle('can', !have && c <= s.coins); btn.title = f.desc;
        const html = have ? '✓ in place' : `<span class="ico ico-coin"></span>${fmt(c)}`;
        const el = body.querySelector(`[data-fxc="${k}"]`); if (el.innerHTML !== html) el.innerHTML = html;
      });
    };
    body.querySelectorAll('[data-m]').forEach((x) => x.addEventListener('click', () => { sfx.tap(); mode = x.dataset.m === 'max' ? 'max' : +x.dataset.m; render(); }));
    body.querySelector('[data-up]').addEventListener('click', () => {
      const before = st.lvl;
      if (!g.buyBizLevel(id, count())) { sfx.error(); render(); return; }
      sfx.buy(); haptic('light');
      const m = BIZ_MILESTONES.find((x) => before < x && st.lvl >= x);
      if (m) { sfx.fanfare(); bigText(m >= 50 ? 'Golden sign!' : 'Busier shop!'); toast(`${b.icon} ${b.short} Lv ${m}! +${pct(BIZ_MILESTONE_BONUS)} income${m < 50 ? ' and more customers' : ''}.`, 'gold'); }
      render();
    });
    body.querySelectorAll('[data-fx]').forEach((x) => x.addEventListener('click', () => {
      const k = +x.dataset.fx; const f = b.fixtures[k];
      body.querySelector('[data-desc]').textContent = `${f.icon} ${f.name}: ${f.desc}`;
      if (st.fx[k]) { sfx.tap(); return; }
      if (g.buyBizFixture(id, k)) { sfx.buy(); sfx.sparkle(); haptic('medium'); toast(`${f.icon} ${f.name} is in! +${pct(BIZ_FIXTURE_BONUS)} income`, 'gold'); }
      else { sfx.error(); x.animate([{ transform: 'translateX(-4px)' }, { transform: 'translateX(4px)' }, { transform: 'none' }], 200); }
      render();
    }));
    const [cc, cr] = st.cell.split(',').map(Number);
    openModal({
      title: `${b.icon} ${b.short}`, wide: true, body, replace: true,
      buttons: [{ label: '📍 Show me', cls: 'plain', onClick: () => { this.ui.panToCell(cc, cr); } }],
      ...live(body, render),
    });
  },

  // The Mole City part of the Deep Stacks overview.
  moleCitySection() {
    const g = this.game; const d = g.s.deep;
    if (!g.moleCityOpen()) return '<div class="section-title">Mole City</div><div class="muted">Restore a library hall and the moles will want to move in…</div>';
    const chips = BIZ.map((b) => {
      const st = d.biz[b.id]; const blk = g.bizBlocker(b.id);
      const cls = st?.built ? 'open' : st ? 'building' : blk === 'halls' ? 'locked' : '';
      const lab = st?.built ? `Lv ${st.lvl}` : st ? '🔨' : blk === 'halls' ? `🔒 ${b.halls} halls` : blk === 'lift' ? 'needs lift' : 'to let';
      return `<button class="mole-shop ${cls}" data-biz="${b.id}" title="${b.name}"><span>${b.icon}</span><small>${lab}</small></button>`;
    }).join('');
    return `<div class="section-title">Mole City <small>🛗 ${d.lift}/${LIFT_ROWS.length} stops · 🏪 ${g.bizCount()}/${BIZ.length} shops · +${pct(E.moleBonus(g.s))}</small></div>
      <div class="mole-shops">${chips}</div>
      <button class="btn plain wide-btn" data-lift style="margin-top:6px">🛗 The Grand Lift</button>`;
  },

  deepCell(c, r) {
    const g = this.game; const s = g.s;
    const act = g.cellAction(c, r); const k = cellKind(c, r);
    const depth = `${(r + 1) * 20} paces down`;
    const job = g.jobAt(c, r);
    if (act === 'rock') { toast(['🪨 Solid bedrock. Even moles won’t dig through that.', '🪨 Bedrock! Digby says it’s older than cheese.', '💎 There are crystals in there, but the rock won’t budge.'][(c + r) % 3]); return; }
    if (act === 'far') { toast('🌫️ Too far away. Dig a tunnel right next to it first.'); return; }
    if (act === 'biz') { sfx.open(); this.biz(g.bizAt(c, r)); return; }
    if (act === 'dug') {
      const kk = k; const f = FOSSIL_AT[cellId(c, r)];
      if (kk === '.' && g.moleCityOpen() && Object.keys(s.deep.biz).length < BIZ.length) { this.bizPick(c, r); return; }
      if (kk === 'F' && f) { const fo = FOSSILS.find((x) => x.id === f); toast(`${fo.icon} ${fo.name}: ${fo.desc}`); }
      else if (kk === 'T') toast('💰 An old chest. Empty now: you already found what was inside!');
      else if (kk === 'E') { this.deep(); }
      else toast(['⛏️ A snug tunnel, propped up with good oak beams.', '🕯️ The crew hung a lantern here.', '🐾 Digby’s crew left little footprints everywhere.'][(c * 3 + r) % 3]);
      return;
    }
    if (act === 'job') {
      const body = h(`<div><div class="art">${job.kind === 'dig' ? '⛏️🐾' : '🔨🐾'}</div><div class="flavor">${job.kind === 'dig' ? 'The mole crew is digging.' : `The crew is working on <b>${HALLS[job.hall].name}</b>: ${HALLS[job.hall].steps[job.step].toLowerCase()}.`}</div><div class="big-reward" data-t>--</div></div>`);
      openModal({
        title: job.kind === 'dig' ? '⛏️ Digging' : '🔨 Restoring', body,
        buttons: [
          { ...this.adBtn('Help the crew', 'dig_speedup', () => { g.speedJob(job); toast('⏩ The crew is working double time!', 'gold'); }), keepOpen: true },
          { label: 'Finish now <span class="ico ico-cheese"></span> <span data-c></span>', cls: 'gold', onClick: () => { if (!g.finishJobCheese(job)) { toast('Not enough golden cheese'); sfx.error(); return false; } return true; } },
        ],
        ...live(body, (hd) => {
          if (!s.deep.jobs.includes(job)) { closeModal(); return; }
          body.querySelector('[data-t]').textContent = `⏳ ${fmtTime(g.jobRemaining(job))}`;
          const cc = hd?.el.querySelector('[data-c]'); if (cc) cc.textContent = g.cheeseForJob(job);
        }),
      });
      return;
    }
    if (act === 'dig') {
      const cost = g.digCost(c, r); const free = g.freeCrews() > 0; const can = s.coins >= cost;
      openModal({
        title: '⛏️ Dig here?',
        body: `<div class="art">🐾⛏️</div><div class="flavor">${k >= '1' && k <= '8' ? 'Digby sniffs the air: “There’s a room behind this. A big one. Smells of old paper.”' : ['“Just soil, I reckon. But you never know what turns up.”', '“Something hard in there. Could be a rock. Could be a bone!”', '“Smells like… adventure. And worms.”'][(c + r * 2) % 3]}</div>
          <div class="muted">${depth} · takes ${fmtTime(digTimeSec(r))}</div>
          ${free ? '' : '<div class="muted warn">Your crew is busy. Wait for them, or hire a second crew.</div>'}
          ${can ? '' : `<div class="muted warn">You need ${fmt(cost - s.coins)} more coins.</div>`}`,
        buttons: [
          { label: `Dig <span class="ico ico-coin"></span> ${fmt(cost)}`, cls: 'gold', disabled: !free || !can, onClick: () => { if (!g.startDig(c, r)) { sfx.error(); return false; } sfx.hammer(); haptic('medium'); return true; } },
          ...(free ? [] : [{ label: '🐾 Crews', cls: 'plain', onClick: () => { setTimeout(() => this.deep(), 200); } }]),
        ],
      });
      return;
    }
    if (act === 'restore' || act === 'locked' || act === 'hall') {
      const n = g.hallAt(c, r); const hl = HALLS[n]; const stage = g.hallStage(n);
      const steps = hl.steps.map((st, j) => `<div class="step ${j < stage ? 'done' : j === stage ? 'now' : ''}">${j < stage ? '✅' : j === stage ? '👉' : '⬜'} ${st}</div>`).join('');
      if (act === 'hall') {
        let mode = 1;
        const body = h(`<div class="wing-sheet"><div class="flavor">${hl.blurb}</div>
          <div class="stats"><div><b data-hl></b><small>level</small></div><div><b data-hb></b><small>library income</small></div><div><b data-hr></b><small>readers</small></div></div>
          <div class="buy-mode"><button data-m="1">×1</button><button data-m="10">×10</button><button data-m="max">MAX</button></div>
          <button class="btn gold wide-btn" data-hup></button>
          <div class="muted" style="margin-top:6px">Each level: +${pct(HALL_PER_LVL)} library income. A second reader at Lv 10, a mole scholar at Lv 25, a gold plaque at Lv 50.</div></div>`);
        const count = () => (mode === 'max' ? Math.max(1, g.hallMaxLevels(n)) : Math.min(mode, HALL_MAX - g.hallLevel(n)));
        const render = () => {
          const lvl = g.hallLevel(n);
          body.querySelector('[data-hl]').textContent = `${lvl} / ${HALL_MAX}`;
          body.querySelector('[data-hb]').textContent = `+${pct(HALL_BONUS + HALL_PER_LVL * (lvl - 1))}`;
          body.querySelector('[data-hr]').textContent = `${1 + (n % 2 === 0 || lvl >= 10 ? 1 : 0) + (lvl >= 25 ? 1 : 0)}`;
          body.querySelectorAll('[data-m]').forEach((x) => x.classList.toggle('on', String(mode) === x.dataset.m));
          const up = body.querySelector('[data-hup]'); const k2 = count(); const cost = g.hallLevelCost(n, k2);
          up.innerHTML = lvl >= HALL_MAX ? 'Fully upgraded ✨' : `Upgrade ×${k2} <span class="ico ico-coin"></span> ${fmt(cost)}`;
          up.disabled = lvl >= HALL_MAX || cost > s.coins;
        };
        body.querySelectorAll('[data-m]').forEach((x) => x.addEventListener('click', () => { sfx.tap(); mode = x.dataset.m === 'max' ? 'max' : +x.dataset.m; render(); }));
        body.querySelector('[data-hup]').addEventListener('click', () => {
          const before = g.hallLevel(n);
          if (!g.buyHallLevel(n, count())) { sfx.error(); render(); return; }
          sfx.buy(); haptic('light');
          const m = [10, 25, 50].find((x) => before < x && g.hallLevel(n) >= x);
          if (m) { sfx.fanfare(); toast(m === 10 ? '📚 Another reader has found this hall!' : m === 25 ? '🐾 A mole scholar has moved in!' : '✨ A gold plaque for the finest hall in the Stacks!', 'gold'); }
          render();
        });
        openModal({
          title: `✨ ${hl.name}`, wide: true, body,
          buttons: [{ label: '📜 Read the Chronicle', cls: 'plain', onClick: () => { setTimeout(() => this.chronicle(g.chroniclePages() - 1), 200); } }],
          ...live(body, render),
        });
        return;
      }
      if (act === 'locked') {
        openModal({ title: `🔒 ${hl.name}`, body: `<div class="art">🔒🗝️</div><div class="flavor">${hl.blurb}</div><div class="muted">The study door has eight locks. Restore the other seven halls to open it (${g.hallsDone()}/7).</div>` });
        return;
      }
      const cost = g.restoreCost(c, r); const free = g.freeCrews() > 0; const can = s.coins >= cost;
      openModal({
        title: `🔨 ${hl.name}`,
        body: `<div class="flavor">${hl.blurb}</div><div class="steps">${steps}</div>
          <div class="muted">Next: <b>${hl.steps[stage]}</b> · takes ${fmtTime(restoreTimeSec(r, stage))}</div>
          ${free ? '' : '<div class="muted warn">Your crew is busy. Wait for them, or hire a second crew.</div>'}
          ${can ? '' : `<div class="muted warn">You need ${fmt(cost - s.coins)} more coins.</div>`}`,
        buttons: [{ label: `${hl.steps[stage]} <span class="ico ico-coin"></span> ${fmt(cost)}`, cls: 'gold', disabled: !free || !can, onClick: () => { if (!g.startRestore(c, r)) { sfx.error(); return false; } sfx.hammer(); haptic('medium'); return true; } }],
      });
      return;
    }
    if (act === 'sealed') { openModal({ title: '🚪 The Great Door', body: `<div class="art">🚪🔒</div><div class="flavor">A door as tall as a house, carved with a sleeping dragon. Warm air seeps under it.</div><div class="muted">Eight locks: <b>${g.hallsDone()}</b> open. Restore every hall to open them all.</div>` }); return; }
    if (act === 'door') {
      openModal({
        title: '🚪 The Great Door', dismissable: true,
        body: '<div class="art">🚪✨</div><div class="flavor">All eight locks are open. Something enormous is breathing on the other side, slowly, like a very old kettle.</div>',
        buttons: [{ label: 'Open the door', cls: 'gold', onClick: () => { g.openDoor(); sfx.fanfare(); this.ui.panToDeep(true); return true; } }],
      });
      return;
    }
    if (act === 'hoard') {
      const today = new Date().toDateString(); const read = s.deep.readDay === today;
      openModal({
        title: '🐉 Umber',
        body: `<div class="art">🐉📖</div><div class="flavor">Umber, Keeper of the Deep Stacks, curled up on four hundred years of books.</div>
          ${s.deep.tales ? '<div class="bonus-line">📖 The Mighty Tales: <b>×2 income</b> forever</div>' : ''}
          <div class="muted">${read ? 'Somebody already read to him today. He’s dozing happily.' : 'Read him a bedtime story? (once a day)'}</div>`,
        buttons: read ? [] : [{ label: '📖 Read to Umber <small>+5 golden cheese</small>', cls: 'gold', onClick: () => { s.deep.readDay = today; g.addCheese(5); this.celebrate([{ kind: 'cheese', amount: 5 }]); toast(`🐉 ${UMBER_LINES[Math.floor(Math.random() * UMBER_LINES.length)]}`, 'gold'); } }],
      });
    }
  },

  // Thessaly's journal, as a little book to read.
  chronicle(start = 0) {
    const g = this.game; const pages = g.chroniclePages();
    if (!pages) { toast('📜 No pages yet. Find the trapdoor first!'); return; }
    let k = Math.max(0, Math.min(pages - 1, start));
    const body = h('<div class="chronicle"></div>');
    const render = () => {
      const p = CHRONICLE[k];
      const text = p.dynamic ? g.chronicleLast() : p.text;
      body.innerHTML = `<div class="ch-page">
          <div class="ch-num">Page ${k + 1} of ${CHRONICLE.length}</div>
          <h3>${p.title}</h3>
          ${text.split('\n\n').map((para) => `<p>${para}</p>`).join('')}
          <div class="ch-sign">— ${p.sign}</div>
        </div>
        <div class="ch-nav"><button class="btn plain" data-p="-1" ${k <= 0 ? 'disabled' : ''}>‹ Back</button><span>${pages < CHRONICLE.length ? `${pages} found` : 'complete'}</span><button class="btn plain" data-p="1" ${k >= pages - 1 ? 'disabled' : ''}>Next ›</button></div>`;
      body.querySelectorAll('[data-p]').forEach((b) => b.addEventListener('click', () => { sfx.pageFlip?.(); k += +b.dataset.p; render(); body.closest('.modal-body')?.scrollTo?.(0, 0); }));
    };
    render();
    openModal({ title: '📜 The Chronicle', wide: true, body, cls: 'chronicle-modal' });
  },

  talesReward() {
    const g = this.game;
    const got = g.claimTales();
    if (!got) return;
    bigText('The Mighty Tales!');
    this.ui.world.fx.confetti(220, this.ui.world.cam.y + this.ui.world.viewH() * 0.4, 70);
    openModal({
      title: '📖 The Mighty Tales', urgent: true,
      body: `<div class="art">📖✨🐉</div><div class="flavor">The book that remembers every story comes home to Whiskerwood Library, and a very old dragon has somebody to read to him again.</div>
        <div class="big-reward">×2 income forever</div><div class="big-reward" style="font-size:20px"><span class="ico ico-cheese"></span>+${got.cheese}</div>
        <div class="muted">The Mighty Tales has written one more page…</div>`,
      buttons: [{ label: '📜 Read the last page', cls: 'gold', onClick: () => { setTimeout(() => this.chronicle(CHRONICLE.length - 1), 250); } }],
    });
  },

  // The daily newspaper from the printing press (reading it once a day earns a little cheese).
  gazette() {
    const g = this.game; const s = g.s; const gz = todaysGazette(g);
    const today = new Date().toDateString(); const fresh = s.flags.gazetteDay !== today;
    const [lead, ...rest] = gz.headlines;
    openModal({
      title: '📰 Today’s Paper', wide: true, cls: 'gazette-modal',
      body: `<div class="gazette">
        <div class="gz-mast">The Whiskerwood Gazette</div>
        <div class="gz-date"><span>Mouse Year ${gz.year} · ${gz.season[0].toUpperCase() + gz.season.slice(1)}</span><span>No. ${gz.edition}</span><span>One crumb</span></div>
        <div class="gz-lead"><h3>${lead.title}</h3><p>${lead.text}</p></div>
        <div class="gz-cols">${rest.map((x) => `<div><h4>${x.title}</h4><p>${x.text}</p></div>`).join('')}</div>
        <div class="gz-box"><b>CLASSIFIEDS</b>${gz.ads.map((a) => `<p>${a}</p>`).join('')}</div>
        <div class="gz-stars">🔮 ${gz.stars}</div>
      </div>`,
      buttons: [{ label: fresh ? 'Thanks, Inky! <small>+2 golden cheese for reading</small>' : 'Fold the paper', cls: fresh ? 'gold' : 'plain', onClick: () => { if (fresh) { s.flags.gazetteDay = today; g.addCheese(2); this.celebrate([{ kind: 'cheese', amount: 2 }]); } } }],
    });
  },

  fossilFound(f) {
    openModal({
      title: '🦴 A fossil!',
      body: `<div class="art">${f.icon}</div><div style="font-size:20px;font-weight:700">${f.name}</div><div class="flavor">${f.desc}</div>
        <div class="bonus-line">+${Math.round(FOSSIL_BONUS * 100)}% library income${this.game.wing('museum').built ? ' · on show in the Museum' : ' · the Museum wing will show it off'}</div>`,
      buttons: [{ label: 'Wonderful!', cls: 'gold' }],
    });
  },
};
void WINGS; void E;
