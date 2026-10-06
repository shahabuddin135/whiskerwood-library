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
  // close() only ever closes this dialog (a timer that outlives it must not close the next one)
  const handle = { el: back, body, closed: false, close: () => { if (current?.handle === handle) closeModal(); }, refresh: null };
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
  // On a phone, the tap that opened this dialog is followed by a "click" at the same spot a moment
  // later, which would land on the dialog: closing it, or even pressing one of its buttons. So
  // the dialog ignores any click that didn't start with a press on the dialog itself.
  let pressed = null;
  back.addEventListener('pointerdown', (e) => { pressed = e.target; }, true);
  back.addEventListener('click', (e) => {
    if (e.detail === 0) return; // keyboard
    if (!pressed) { e.stopPropagation(); e.preventDefault(); }
  }, true);
  back.querySelector('.modal-close')?.addEventListener('click', () => { sfx.close(); handle.close(); });
  back.addEventListener('click', (e) => { if (e.target === back && pressed === back && opts.dismissable !== false) { sfx.close(); handle.close(); } });
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
  c.handle.closed = true;
  c.back.remove();
  document.body.classList.remove('modal-open');
  c.opts.onClose?.();
  if (!silent && queue.length) setTimeout(() => { if (!current && queue.length) openModal(queue.shift()); }, 180);
}
