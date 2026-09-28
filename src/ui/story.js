// Story dialogue overlay: portrait + name + typewriter text. Tap to continue.
import { $, h } from './dom.js';
import { CHARACTERS, STORY } from '../data/story.js';
import { portrait } from './portraits.js';
import { modalOpen } from './modals.js';
import { sfx } from '../audio/sfx.js';

export class StoryUI {
  constructor(ui) {
    this.ui = ui;
    this.game = ui.game;
    this.queue = [];
    this.active = null;
    this.el = h(`<div id="story" class="story-overlay" aria-live="polite">
      <div class="story-card">
        <img class="story-portrait" alt="" />
        <div class="story-main">
          <div class="story-name"><b></b><small></small></div>
          <div class="story-text"></div>
          <div class="story-next">tap to continue ▸</div>
        </div>
        <button class="story-skip">Skip</button>
      </div></div>`);
    document.body.appendChild(this.el);
    this.el.addEventListener('click', (e) => {
      if (e.target.closest('.story-skip')) { this.finish(); return; }
      this.advance();
    });
    this.typer = null;
  }

  get open() { return !!this.active; }

  // Queue a chapter by id (ignored if already seen).
  play(id) {
    if (this.game.storySeen(id) || this.queue.includes(id) || this.active?.id === id) return;
    this.queue.push(id);
    this.tryStart();
  }

  // Called every UI refresh: start automatic chapters and queued ones.
  tick() {
    const ev = this.ui.world.events;
    const hectic = ev.cat || ev.worms || this.ui.thief; // never interrupt a timed event
    if (!this.active && !this.queue.length && !hectic) {
      const ch = this.game.nextStory();
      if (ch) this.queue.push(ch.id);
    }
    this.tryStart();
  }

  tryStart() {
    if (this.active || !this.queue.length || modalOpen() || this.ui.sheet.isOpen) return;
    const id = this.queue.shift();
    const ch = STORY.find((c) => c.id === id);
    if (!ch || this.game.storySeen(id)) return;
    this.active = { id, lines: ch.lines, k: 0 };
    this.game.markStory(id);
    this.el.classList.add('show');
    this.show();
  }

  show() {
    const { lines, k } = this.active;
    const [who, text] = lines[k];
    const ch = CHARACTERS[who];
    this.el.querySelector('.story-portrait').src = portrait(who);
    this.el.querySelector('.story-name b').textContent = ch.name;
    this.el.querySelector('.story-name small').textContent = ch.role;
    this.el.querySelector('.story-card').dataset.who = who;
    const out = this.el.querySelector('.story-text');
    out.textContent = '';
    clearInterval(this.typer);
    let n = 0;
    this.typing = true;
    this.typer = setInterval(() => {
      n += 2;
      out.textContent = text.slice(0, n);
      if (n % 6 === 0) sfx.dialog();
      if (n >= text.length) { clearInterval(this.typer); this.typing = false; }
    }, 28);
    this.fullText = text;
  }

  advance() {
    if (!this.active) return;
    if (this.typing) { clearInterval(this.typer); this.typing = false; this.el.querySelector('.story-text').textContent = this.fullText; return; }
    sfx.tap();
    this.active.k++;
    if (this.active.k >= this.active.lines.length) this.finish();
    else this.show();
  }

  finish() {
    clearInterval(this.typer);
    const id = this.active?.id;
    this.active = null;
    this.el.classList.remove('show');
    this.ui.onStoryDone?.(id);
    setTimeout(() => this.tryStart(), 400);
  }
}
