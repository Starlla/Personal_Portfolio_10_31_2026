/**
 * Halloween creatures for the ASCII canvas: ghosts and jack-o'-lanterns.
 * Each creature paints brightness values into the same character grid the
 * jellyfish use; the canvas turns them into glyphs.
 */

export type Color = { h: number; s: number };

// Palette indices used below
const GHOST = 0, PUMPKIN = 1, FLAME = 2, STEM = 3;
export const HALLOWEEN_PALETTE: Color[] = [
  { h: 195, s: 30 }, // ghost: pale moonlit white
  { h: 26, s: 95 },  // pumpkin orange
  { h: 45, s: 100 }, // carved-face glow
  { h: 105, s: 55 }, // pumpkin stem
];

export type Painter = {
  cw: number; // cell width, px
  ch: number; // cell height, px
  plot: (px: number, py: number, v: number, color: number) => void;
};

type Ghost = { kind: "ghost"; x: number; y: number; r: number; speed: number; seed: number; vx: number };
type Pumpkin = { kind: "pumpkin"; x: number; y: number; r: number; seed: number };
export type Creature = Ghost | Pumpkin;

const rand = (a: number, b: number) => a + Math.random() * (b - a);
const smoothstep = (e0: number, e1: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0)));
  return t * t * (3 - 2 * t);
};

/** Visit the center of every grid cell inside a pixel rectangle. */
function forCells(p: Painter, x0: number, y0: number, x1: number, y1: number, fn: (px: number, py: number) => void) {
  const cx0 = Math.floor(x0 / p.cw) * p.cw + p.cw / 2;
  const cy0 = Math.floor(y0 / p.ch) * p.ch + p.ch / 2;
  for (let py = cy0; py <= y1; py += p.ch) for (let px = cx0; px <= x1; px += p.cw) fn(px, py);
}

// ---------- spawning ----------

function scale(w: number) {
  return Math.min(1, Math.max(0.6, w / 1300));
}

function makeGhost(w: number, h: number, y?: number): Ghost {
  const r = rand(52, 82) * scale(w);
  return { kind: "ghost", x: rand(r, w - r), y: y ?? h + r * 2 + rand(0, 120), r, speed: rand(12, 24), seed: rand(0, 1000), vx: 0 };
}
function makePumpkin(w: number, h: number, y?: number): Pumpkin {
  const r = rand(56, 84) * scale(w);
  return { kind: "pumpkin", x: rand(r * 1.5, w - r * 1.5), y: y ?? h + r * 2, r, seed: rand(0, 1000) };
}

export function createHalloween(w: number, h: number): Creature[] {
  const area = (w * h) / 900000;
  const n = (base: number) => Math.max(1, Math.round(base * Math.min(1.4, Math.max(0.5, area))));
  const out: Creature[] = [];
  const ghosts = n(3), pumpkins = n(2);
  for (let i = 0; i < ghosts; i++) out.push(makeGhost(w, h, ((i + 0.5) / ghosts) * h * 1.1));
  for (let i = 0; i < pumpkins; i++) out.push(makePumpkin(w, h, rand(h * 0.3, h * 0.95)));
  for (let k = 0; k < 40; k++) separate(out, 1, w); // spread out before the first frame
  return out;
}

// ---------- personal space ----------
// Creatures keep a little distance so they never stack.

const GAP = 18; // px of breathing room between creatures

function bodyOf(c: Creature): { x: number; y: number; r: number } {
  if (c.kind === "ghost") return { x: c.x, y: c.y + c.r * 0.3, r: c.r * 1.3 };
  return { x: c.x, y: c.y - c.r * 0.1, r: c.r * 1.4 };
}

/** Push overlapping creatures apart. strength 0..1 = how much of the overlap to fix now. */
function separate(list: Creature[], strength: number, w: number) {
  for (let i = 0; i < list.length; i++) {
    const a = bodyOf(list[i]);
    for (let j = i + 1; j < list.length; j++) {
      const b = bodyOf(list[j]);
      let dx = b.x - a.x, dy = b.y - a.y;
      let d = Math.hypot(dx, dy);
      const min = a.r + b.r + GAP;
      if (d >= min) continue;
      if (d < 0.001) { dx = Math.random() - 0.5; dy = 0; d = Math.abs(dx) || 1; }
      // prefer sliding sideways so nobody's upward drift gets cancelled
      const push = ((min - d) / 2) * strength;
      const ux = dx / d, uy = (dy / d) * 0.6;
      list[i].x -= ux * push; list[i].y -= uy * push;
      list[j].x += ux * push; list[j].y += uy * push;
      a.x -= ux * push; a.y -= uy * push;
    }
  }
  // keep everyone on screen horizontally
  for (const c of list) {
    const r = bodyOf(c).r * 0.8;
    c.x = Math.min(w - r, Math.max(r, c.x));
  }
}

/** Put a freshly spawned creature in the most open spot along the bottom. */
function placeInOpenSpace(list: Creature[], idx: number, w: number) {
  const me = bodyOf(list[idx]);
  let bestX = list[idx].x, bestGap = -Infinity;
  for (let k = 0; k < 8; k++) {
    const x = me.r + Math.random() * Math.max(1, w - me.r * 2);
    let gap = Infinity;
    for (let j = 0; j < list.length; j++) {
      if (j === idx) continue;
      const o = bodyOf(list[j]);
      gap = Math.min(gap, Math.hypot(o.x - x, o.y - me.y) - o.r - me.r);
    }
    if (gap > bestGap) { bestGap = gap; bestX = x; }
  }
  list[idx].x = bestX;
}

// ---------- motion ----------

export function updateHalloween(
  list: Creature[], dt: number, t: number, w: number, h: number,
  pointer: { x: number; y: number; active: boolean }
) {
  for (let i = 0; i < list.length; i++) {
    const c = list[i];
    if (c.kind === "ghost") {
      c.y -= c.speed * dt;
      // curious ghosts drift toward the cursor
      if (pointer.active) {
        const dx = pointer.x - c.x, dy = pointer.y - c.y, d = Math.hypot(dx, dy);
        if (d < 380 && d > 1) {
          const pull = (1 - d / 380) * 45;
          c.vx += (dx / d) * pull * dt;
          c.y += (dy / d) * pull * 0.4 * dt;
        }
      }
      c.vx += Math.sin(t * 0.5 + c.seed) * 10 * dt;
      c.vx *= 1 - 0.9 * dt;
      c.x += c.vx * dt + Math.sin(t * 0.9 + c.seed) * 12 * dt;
      if (c.y + c.r * 2.6 < 0) {
        list[i] = makeGhost(w, h);
        placeInOpenSpace(list, i, w);
      }
    } else {
      c.y -= 9 * dt;
      c.x += Math.sin(t * 0.35 + c.seed) * 6 * dt;
      if (c.y + c.r * 1.6 < 0) {
        list[i] = makePumpkin(w, h);
        placeInOpenSpace(list, i, w);
      }
    }
  }
  separate(list, Math.min(1, dt * 5), w);
}

// ---------- drawing ----------

function paintGhost(g: Ghost, t: number, p: Painter) {
  const R = g.r;
  const shimmer = 0.82 + 0.18 * Math.sin(t * 2 + g.seed);
  forCells(p, g.x - R, g.y - R, g.x + R, g.y + R * 1.8, (px, py) => {
    const nx = (px - g.x) / R;
    const ny = (py - g.y) / R;
    let edge: number;
    if (ny <= 0) {
      const d = Math.hypot(nx, ny);
      if (d > 1) return;
      edge = d;
    } else {
      if (Math.abs(nx) > 1) return;
      const hem = 1.45 + 0.2 * Math.sin(nx * 7 + t * 4 + g.seed);
      if (ny > hem) return;
      edge = Math.max(Math.abs(nx), smoothstep(hem - 0.5, hem, ny));
    }
    // carved-out eyes and "oooh" mouth
    const eye = (ex: number) => ((nx - ex) / 0.17) ** 2 + ((ny + 0.12) / 0.27) ** 2 < 1;
    if (eye(-0.35) || eye(0.35)) return;
    if ((nx / 0.15) ** 2 + ((ny - 0.42) / 0.2) ** 2 < 1) return;
    const v = (0.5 + 0.48 * smoothstep(0.72, 1, edge)) * shimmer;
    p.plot(px, py, v, GHOST);
  });
}

function paintPumpkin(k: Pumpkin, t: number, p: Painter) {
  const r = k.r, rx = r * 1.25;
  const cy = k.y + Math.sin(t * 0.7 + k.seed) * 6;
  const flicker = 0.85 + 0.15 * Math.sin(t * 11 + k.seed) * Math.sin(t * 7.3);
  forCells(p, k.x - rx, cy - r, k.x + rx, cy + r, (px, py) => {
    const nx = (px - k.x) / rx, ny = (py - cy) / r;
    const d = Math.hypot(nx, ny);
    if (d > 1) return;
    // carved face glows
    const eye = (ex: number) => ny > -0.42 && ny < -0.06 && Math.abs(nx - ex) < (ny + 0.42) * 0.62;
    const nose = ny > 0.02 && ny < 0.16 && Math.abs(nx) < (ny - 0.02) * 0.9 + 0.02;
    const mouth = Math.abs(nx) < 0.62 && ny > 0.24 + 0.08 * Math.abs(Math.sin(nx * 11)) && ny < 0.56 - 0.3 * nx * nx;
    if (eye(-0.36) || eye(0.36) || nose || mouth) {
      p.plot(px, py, 0.82 + 0.18 * flicker, FLAME);
      return;
    }
    const rib = 0.5 + 0.5 * Math.cos(nx * Math.PI * 2.4);
    const v = 0.16 + 0.2 * rib * (1 - 0.3 * d) + 0.5 * smoothstep(0.82, 1, d);
    p.plot(px, py, v, PUMPKIN);
  });
  // stem
  forCells(p, k.x - r * 0.12, cy - r * 1.32, k.x + r * 0.12, cy - r * 0.92, (px, py) => {
    p.plot(px + (cy - r - py) * 0.25, py, 0.65, STEM);
  });
}

export function paintHalloween(list: Creature[], t: number, p: Painter) {
  // pumpkins first, ghosts drawn over them
  for (const c of list) if (c.kind === "pumpkin") paintPumpkin(c, t, p);
  for (const c of list) if (c.kind === "ghost") paintGhost(c, t, p);
}
