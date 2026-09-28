const SUFFIX = ['', 'K', 'M', 'B', 'T'];

function letters(k) {
  // aa, ab, ... az, ba, ...
  return String.fromCharCode(97 + Math.floor(k / 26) % 26) + String.fromCharCode(97 + (k % 26));
}

export function fmt(n) {
  if (n === Infinity) return '∞';
  if (!isFinite(n) || isNaN(n)) return '0';
  if (n < 0) return '-' + fmt(-n);
  if (n < 1000) return n < 10 && n % 1 > 0.05 ? n.toFixed(1) : String(Math.floor(n));
  let e = Math.floor(Math.log10(n) / 3);
  let v = n / Math.pow(10, e * 3);
  if (v >= 999.5) { e++; v /= 1000; }
  const suffix = e < SUFFIX.length ? SUFFIX[e] : letters(e - SUFFIX.length);
  const s = String(parseFloat(v.toFixed(v < 10 ? 2 : v < 100 ? 1 : 0)));
  return s + suffix;
}

export function fmtTime(sec) {
  sec = Math.max(0, Math.ceil(sec));
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  if (h > 0) return `${h}h ${String(m).padStart(2, '0')}m`;
  if (m > 0) return `${m}:${String(s).padStart(2, '0')}`;
  return `${s}s`;
}

export function dayKey(ts = Date.now()) {
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function daysBetween(a, b) {
  const pa = new Date(a + 'T00:00:00');
  const pb = new Date(b + 'T00:00:00');
  return Math.round((pb - pa) / 86400000);
}
