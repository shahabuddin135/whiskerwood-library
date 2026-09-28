// Modal dialogs with a gentle queue so pop-ups never stack on top of each other.
import { $, h } from './dom.js';
import { sfx } from '../audio/sfx.js';

let current = null;
const queue = [];

export function modalOpen() { return !!current; }

// opts: { title, body (html|Node), buttons:[{label, cls, onClick, keepOpen, disabled}], wide, onClose, dismissable, urgent, row }
export function openModal(opts) {
  if (current && !opts.replace) {
    if (opts.urgent) queue.unshift(opts); else queue.push(opts);
    return null;
  }
  if (current && opts.replace) closeModal(true);
  const back = h(`<div class="modal-back"><div class="modal ${opts.wide ? 'wide' : ''} ${opts.cls || ''}">
      ${opts.title ? `<div class="modal-ribbon">${opts.title}</div>` : ''}
      ${opts.dismissable === false ? '' : '<button class="modal-close" aria-label="Close">✕</button>'}
      <div class="modal-body"></div>
      <div class="modal-btns ${opts.row ? 'row2' : ''}"></div>
    </div></div>`);
  const body = back.querySelector('.modal-body');
  if (typeof opts.body === 'string') body.innerHTML = opts.body; else if (opts.body) body.appendChild(opts.body);
  const btns = back.querySelector('.modal-btns');
  const handle = { el: back, body, close: () => closeModal(), refresh: null };
  (opts.buttons || []).forEach((b) => {
    const el = h(`<button class="btn ${b.cls || ''}">${b.label}</button>`);
    if (b.disabled) el.disabled = true;
    el.addEventListener('click', async () => {
      if (el.disabled) return;
      sfx.tap();
      el.disabled = true;
      const res = await b.onClick?.(handle, el);
      if (!b.keepOpen && res !== false) closeModal(); else el.disabled = !!b.stayDisabled;
    });
    btns.appendChild(el);
    b.el = el;
  });
  if (!btns.children.length) btns.remove();
  back.querySelector('.modal-close')?.addEventListener('click', () => { sfx.close(); closeModal(); });
  back.addEventListener('click', (e) => { if (e.target === back && opts.dismissable !== false) { sfx.close(); closeModal(); } });
  $('#modalRoot').appendChild(back);
  current = { back, opts, handle };
  document.body.classList.add('modal-open');
  opts.onOpen?.(handle);
  return handle;
}

export function closeModal(silent = false) {
  if (!current) return;
  const c = current;
  current = null;
  c.back.remove();
  document.body.classList.remove('modal-open');
  c.opts.onClose?.();
  if (!silent && queue.length) setTimeout(() => { if (!current && queue.length) openModal(queue.shift()); }, 180);
}
