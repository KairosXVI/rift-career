/* Utilidades compartidas. Todo el juego vive en el espacio de nombres global RC. */
window.RC = window.RC || {};
(function (RC) {
  const U = {};

  U.rand = (a, b) => a + Math.random() * (b - a);
  U.randInt = (a, b) => Math.floor(U.rand(a, b + 1));
  U.chance = (p) => Math.random() < p;
  U.pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  U.clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  U.round1 = (v) => Math.round(v * 10) / 10;
  U.gauss = () => {
    let u = 0, v = 0;
    while (!u) u = Math.random();
    while (!v) v = Math.random();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  };
  U.shuffle = (arr) => {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };
  U.weighted = (items, wfn) => {
    const ws = items.map(wfn);
    const total = ws.reduce((s, w) => s + Math.max(0, w), 0);
    if (total <= 0) return U.pick(items);
    let r = Math.random() * total;
    for (let i = 0; i < items.length; i++) {
      r -= Math.max(0, ws[i]);
      if (r <= 0) return items[i];
    }
    return items[items.length - 1];
  };
  U.logistic = (x) => 1 / (1 + Math.exp(-x));
  U.sum = (arr) => arr.reduce((s, v) => s + v, 0);
  U.avg = (arr) => (arr.length ? U.sum(arr) / arr.length : 0);

  U.money = (v) => {
    const n = Math.round(v);
    const abs = Math.abs(n);
    let s;
    if (abs >= 1e6) s = (n / 1e6).toFixed(abs >= 1e7 ? 1 : 2).replace('.', ',') + ' M';
    else if (abs >= 1e4) s = Math.round(n / 1000) + ' k';
    else s = n.toLocaleString('es-ES');
    return s + ' €';
  };
  U.num = (v) => {
    const n = Math.round(v);
    if (n >= 1e6) return (n / 1e6).toFixed(n >= 1e7 ? 1 : 2).replace('.', ',') + ' M';
    if (n >= 1e4) return Math.round(n / 1000) + ' k';
    return n.toLocaleString('es-ES');
  };
  U.esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  U.slug = (s) => String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  U.hashColor = (s) => {
    let h = 0;
    for (const c of String(s)) h = (h * 31 + c.charCodeAt(0)) >>> 0;
    return `hsl(${h % 360} 55% 42%)`;
  };
  U.uid = () => Math.random().toString(36).slice(2, 10);

  RC.U = U;
})(window.RC);
