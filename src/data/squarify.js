// Squarified treemap layout. Pure function — no DOM, no React.
// Input: items as [{ t, a }] where `t` is the theme and `a` is its
// (already-scaled) area. Returns [{ t, x, y, w, h }] rectangles.

export function squarify(items, X, Y, W, H) {
  const out = [];
  let x = X, y = Y, w = W, h = H;
  const rem = items.slice();
  let row = [];

  const ratio = (r, side) => {
    const s = r.reduce((a, b) => a + b.a, 0);
    let mx = -1e9, mn = 1e9;
    r.forEach((it) => { mx = Math.max(mx, it.a); mn = Math.min(mn, it.a); });
    return Math.max((side * side * mx) / (s * s), (s * s) / (side * side * mn));
  };

  const place = (r) => {
    const s = r.reduce((a, b) => a + b.a, 0);
    if (w >= h) {
      const dx = s / h;
      let cy = y;
      r.forEach((it) => { const dh = it.a / dx; out.push({ t: it.t, x, y: cy, w: dx, h: dh }); cy += dh; });
      x += dx; w -= dx;
    } else {
      const dy = s / w;
      let cx = x;
      r.forEach((it) => { const dw = it.a / dy; out.push({ t: it.t, x: cx, y, w: dw, h: dy }); cx += dw; });
      y += dy; h -= dy;
    }
  };

  while (rem.length) {
    const it = rem[0];
    const side = Math.min(w, h);
    if (!row.length) { row.push(rem.shift()); continue; }
    if (ratio(row.concat(it), side) <= ratio(row, side)) row.push(rem.shift());
    else { place(row); row = []; }
  }
  if (row.length) place(row);
  return out;
}
