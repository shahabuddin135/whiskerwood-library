export class Emitter {
  constructor() { this._h = new Map(); }
  on(ev, fn) {
    if (!this._h.has(ev)) this._h.set(ev, new Set());
    this._h.get(ev).add(fn);
    return () => this._h.get(ev)?.delete(fn);
  }
  emit(ev, data) {
    this._h.get(ev)?.forEach((fn) => {
      try { fn(data); } catch (e) { console.error(`[${ev}]`, e); }
    });
    this._h.get('*')?.forEach((fn) => fn(ev, data));
  }
}
