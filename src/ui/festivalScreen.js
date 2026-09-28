// The festival board: what is going on, the daily festival gift, the festival quest and the
// limited shop (festival books and exclusive furniture, bought with festival tokens).
import { openModal } from './modals.js';
import { h, ig, toast } from './dom.js';
import { icon } from './icons.js';
import { artImg } from './art.js';
import { thumb } from './thumbs.js';
import { FURNITURE, RARITY_INFO } from '../data/furniture.js';
import { FESTIVAL_QUEST } from '../data/festivals.js';
import { TOKEN_ICON } from '../world/festivalFx.js';
import { fmtTime } from '../core/format.js';
import { sfx } from '../audio/sfx.js';
import { Ads } from '../ads/ads.js';

export function festivalScreen(S) {
  const g = S.game; const f = g.festival();
  if (!f) { toast('No festival right now. Keep an eye on the calendar!', '', 'festival'); return; }
  const body = h('<div></div>');
  const tok = TOKEN_ICON[f.id];
  const render = () => {
    const st = g.festState();
    const left = Math.max(0, (f.end - Date.now()) / 1000);
    const items = FURNITURE.filter((x) => x.festival === f.id);
    const books = g.festivalBooks();
    body.innerHTML = `${artImg('tokens', { icon: tok })}
      <div class="flavor">${f.blurb}</div>
      <div class="muted">${left > 0 && left < 60 * 86400 ? `Ends in ${fmtTime(left)}` : ''} · tap glowing ${f.token.name.toLowerCase()} on any floor to collect them</div>
      <div style="margin:8px 0"><span class="token-count">${icon(tok)}${st.tokens} ${f.token.name}</span></div>
      <div class="shop-sec">${icon('gift')}Today’s ${f.gift}</div>
      ${g.festGiftReady() ? `<div class="modal-btns row2" style="padding:0 0 6px"><button class="btn ad" data-gift="2">Claim ×2</button><button class="btn plain" data-gift="1">Claim</button></div>` : '<div class="muted">Collected today — come back tomorrow!</div>'}
      <div class="shop-sec">${icon('scroll')}Festival quest</div>
      <div class="fest-quests">${FESTIVAL_QUEST.map((_, k) => { const q = g.festQuest(k); return `<div class="fq ${q.claimed ? 'done' : ''}"><div class="fq-body">${q.text}<div class="bar"><i style="width:${(q.cur / q.target) * 100}%"></i></div></div>${q.claimed ? `<span style="width:26px;height:26px">${icon('check')}</span>` : `<button class="btn ${q.done ? 'gold' : 'plain'}" data-q="${k}" ${q.done ? '' : 'disabled'}>${q.cur}/${q.target}</button>`}</div>`; }).join('')}</div>
      <div class="shop-sec">${icon('book')}Festival books <small style="font-weight:500">+3% income each, forever</small></div>
      <div class="cat-grid">${books.map((b) => { const own = g.s.fbooks[b.id]; return `<div class="fcard ${own ? 'owned' : ''}"><div class="ft"><div class="book ${b.rarity}" style="background:${b.color};width:52px">${''}<span>${b.title}</span></div></div><b>${b.title}</b><div class="fd">${b.blurb}</div>${own ? '<button class="btn plain" disabled>In your album</button>' : `<button class="btn gold" data-fb="${b.id}">${ig(tok)}${b.tokens}</button>`}</div>`; }).join('')}</div>
      <div class="shop-sec">${icon('chair')}Festival furniture <small style="font-weight:500">only while the festival lasts</small></div>
      <div class="cat-grid">${items.map((x) => { const own = g.ownsFurniture(x.id); return `<div class="fcard ${own ? 'owned' : ''}"><span class="rar-tag" style="background:${RARITY_INFO[x.rarity].color}">${RARITY_INFO[x.rarity].name}</span><div class="ft"><img src="${thumb(x.id)}" alt=""></div><b>${x.name}</b><div class="fd">${x.desc}</div>${own ? '<button class="btn plain" disabled>Owned</button>' : `<button class="btn gold" data-fi="${x.id}">${ig(tok)}${x.tokens}</button>`}</div>`; }).join('')}</div>`;
    body.querySelectorAll('[data-gift]').forEach((b) => b.addEventListener('click', async () => {
      const mult = +b.dataset.gift;
      if (mult === 2) { if (!(await Ads.rewarded('festival_gift'))) return; g.s.stats.adsWatched++; }
      const got = g.claimFestGift(mult); if (got) S.celebrate(got);
      render(); S.ui.refreshBadges();
    }));
    body.querySelectorAll('[data-q]').forEach((b) => b.addEventListener('click', () => { const got = g.claimFestQuest(+b.dataset.q); if (got) { S.celebrate(got); const fb = got.find((r) => r.kind === 'fbook'); if (fb) toast(`New festival book: ${fb.book.title}!`, 'gold', 'book'); } render(); S.ui.refreshBadges(); }));
    body.querySelectorAll('[data-fb]').forEach((b) => b.addEventListener('click', () => { const got = g.buyFestivalBook(b.dataset.fb); if (!got) { sfx.error(); toast(`Not enough ${f.token.name.toLowerCase()}`, '', 'festival'); return; } sfx.sparkle(); S.bookDetail(got, true); }));
    body.querySelectorAll('[data-fi]').forEach((b) => b.addEventListener('click', () => { if (!g.buyFurniture(b.dataset.fi, S.ui.world.focusedRoom())) { sfx.error(); toast(`Not enough ${f.token.name.toLowerCase()}`, '', 'festival'); return; } sfx.buy(); toast('Yours to keep, every year!', 'gold', 'festival'); render(); }));
  };
  render();
  openModal({ title: f.name, icon: f.icon, body, wide: true });
}
