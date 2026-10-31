/**
 * Halloween creatures for the ASCII canvas: ghosts, bats, floating candles
 * and jack-o'-lanterns. Each creature paints brightness values into the same
 * character grid the jellyfish use; the canvas turns them into glyphs.
 */

export type Color = { h: number; s: number };

// Palette indices used below
const GHOST = 0, PUMPKIN = 1, FLAME = 2, BAT = 3, WAX = 4, STEM = 5;
export const HALLOWEEN_PALETTE: Color[] = [
  { h: 195, s: 30 }, // ghost: pale moonlit white
  { h: 26, s: 95 },  // pumpkin orange
  { h: 45, s: 100 }, // candle flame / carved glow
  { h: 272, s: 60 }, // bat purple
  { h: 38, s: 28 },  // candle wax
  { h: 105, s: 55 }, // pumpkin stem
];

export type Painter = {
  cw: number; // cell width, px
  ch: number; // cell height, px
  plot: (px: number, py: number, v: number, color: number) => void;
};

type Ghost = { kind: "ghost"; x: number; y: number; r: number; speed: number; seed: number; vx: number };
type Bat = { kind: "bat"; x: number; y: number; s: number; dir: 1 | -1; speed: number; phase: number; seed: number };
type Candle = { kind: "candle"; x: number; y: number; w: number; h: number; seed: number; drip: number };
type Pumpkin = { kind: "pumpkin"; x: number; y: number; r: number; seed: number };
export type Creature = Ghost | Bat | Candle | Pumpkin;

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
function makeBat(w: number, h: number, anywhere = false): Bat {
  const dir: 1 | -1 = Math.random() < 0.5 ? 1 : -1;
  const s = rand(20, 34) * scale(w);
  return {
    kind: "bat", s, dir, speed: rand(55, 110), phase: rand(0, 6.28), seed: rand(0, 1000),
    x: anywhere ? rand(0, w) : dir === 1 ? -s * 3 : w + s * 3,
    y: rand(h * 0.08, h * 0.7),
  };
}
function makeCandle(w: number, h: number, y?: number): Candle {
  const s = scale(w);
  return { kind: "candle", x: rand(40, w - 40), y: y ?? h + 120, w: rand(14, 22) * s, h: rand(50, 95) * s, seed: rand(0, 1000), drip: rand(0.15, 0.55) };
}
function makePumpkin(w: number, h: number, y?: number): Pumpkin {
  const r = rand(56, 84) * scale(w);
  return { kind: "pumpkin", x: rand(r * 1.5, w - r * 1.5), y: y ?? h + r * 2, r, seed: rand(0, 1000) };
}

export function createHalloween(w: number, h: number): Creature[] {
  const area = (w * h) / 900000;
  const n = (base: number) => Math.max(1, Math.round(base * Math.min(1.4, Math.max(0.5, area))));
  const out: Creature[] = [];
  const ghosts = n(3), candles = n(4), pumpkins = n(2), bats = n(4);
  for (let i = 0; i < ghosts; i++) out.push(makeGhost(w, h, ((i + 0.5) / ghosts) * h * 1.1));
  for (let i = 0; i < candles; i++) out.push(makeCandle(w, h, rand(h * 0.1, h * 0.95)));
  for (let i = 0; i < pumpkins; i++) out.push(makePumpkin(w, h, rand(h * 0.3, h * 0.95)));
  for (let i = 0; i < bats; i++) out.push(makeBat(w, h, true));
  return out;
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
      if (c.y + c.r * 2.6 < 0) list[i] = makeGhost(w, h);
    } else if (c.kind === "bat") {
      c.phase += dt * 13;
      c.x += c.dir * c.speed * dt;
      c.y += Math.sin(t * 2.2 + c.seed) * 35 * dt;
      // bats dodge the cursor
      if (pointer.active) {
        const dx = c.x - pointer.x, dy = c.y - pointer.y, d = Math.hypot(dx, dy);
        if (d < 170 && d > 1) c.y += (dy / d) * (1 - d / 170) * 180 * dt;
      }
      if (c.x < -c.s * 4 || c.x > w + c.s * 4) list[i] = makeBat(w, h);
    } else if (c.kind === "candle") {
      c.y -= 7 * dt;
      c.x += Math.sin(t * 0.4 + c.seed) * 4 * dt;
      if (c.y + c.h < -60) list[i] = makeCandle(w, h);
    } else {
      c.y -= 9 * dt;
      c.x += Math.sin(t * 0.35 + c.seed) * 6 * dt;
      if (c.y + c.r * 1.6 < 0) list[i] = makePumpkin(w, h);
    }
  }
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

function paintBat(b: Bat, p: Painter) {
  const s = b.s;
  const flap = Math.sin(b.phase); // -1..1
  // body + ears
  forCells(p, b.x - s * 0.3, b.y - s * 0.55, b.x + s * 0.3, b.y + s * 0.45, (px, py) => {
    const nx = (px - b.x) / (s * 0.24), ny = (py - b.y) / (s * 0.38);
    if (nx * nx + ny * ny <= 1) p.plot(px, py, 0.9, BAT);
  });
  p.plot(b.x - s * 0.15, b.y - s * 0.5, 0.75, BAT);
  p.plot(b.x + s * 0.15, b.y - s * 0.5, 0.75, BAT);
  // wings
  for (const k of [-1, 1]) {
    const sx = b.x + k * s * 0.2, sy = b.y - s * 0.1;
    const tx = b.x + k * s * 1.7, ty = b.y - s * 0.25 - flap * s * 0.75;
    const steps = Math.max(2, Math.ceil(Math.abs(tx - sx) / p.cw));
    for (let i = 0; i <= steps; i++) {
      const u = i / steps;
      const px = sx + (tx - sx) * u;
      const top = sy + (ty - sy) * u;
      const scallop = s * 0.22 * Math.abs(Math.sin(u * Math.PI * 3));
      const bottom = sy + s * 0.5 + (ty + s * 0.12 - (sy + s * 0.5)) * u - scallop;
      for (let py = top; py <= bottom; py += p.ch * 0.9) {
        const edge = py - top < p.ch || bottom - py < p.ch ? 0.9 : 0.6;
        p.plot(px, py, edge, BAT);
      }
      p.plot(px, top, 0.95, BAT);
    }
  }
}

function paintCandle(c: Candle, t: number, p: Painter) {
  const bob = Math.sin(t * 0.8 + c.seed) * 8;
  const top = c.y + bob;
  const x0 = c.x - c.w / 2, x1 = c.x + c.w / 2;
  // wax body
  forCells(p, x0, top, x1, top + c.h, (px, py) => {
    const edge = Math.abs(px - c.x) / (c.w / 2);
    const v = 0.4 + 0.3 * smoothstep(0.5, 1, edge) + (py - top < p.ch * 1.2 ? 0.2 : 0);
    p.plot(px, py, v, WAX);
  });
  // a wax drip down one side
  const dripX = c.seed % 2 > 1 ? x0 + p.cw * 0.5 : x1 - p.cw * 0.5;
  for (let py = top; py < top + c.h * c.drip; py += p.ch) p.plot(dripX, py, 0.75, WAX);
  // wick
  p.plot(c.x, top - p.ch * 0.6, 0.5, WAX);
  // flickering flame
  const fh = 18 * (1 + 0.15 * Math.sin(t * 14 + c.seed) + 0.1 * Math.sin(t * 23 + c.seed * 2));
  const fw = 7;
  const fy = top - p.ch * 0.6 - fh * 0.55;
  const sway = Math.sin(t * 6 + c.seed) * 2;
  forCells(p, c.x - 50, fy - 50, c.x + 50, fy + 50, (px, py) => {
    const dx = px - c.x - sway, dy = py - fy;
    const nx = dx / fw, ny = dy / fh;
    const r = Math.hypot(nx, ny < 0 ? ny * 0.55 : ny);
    if (r < 1) {
      p.plot(px, py, 0.7 + 0.3 * (1 - r), FLAME);
    } else {
      // warm halo
      const d = Math.hypot(dx, dy);
      if (d < 50) p.plot(px, py, 0.13 * (1 - d / 50) * (0.85 + 0.15 * Math.sin(t * 9 + c.seed)), FLAME);
    }
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
  // candles & pumpkins first, ghosts and bats drawn over them
  for (const c of list) if (c.kind === "candle") paintCandle(c, t, p);
  for (const c of list) if (c.kind === "pumpkin") paintPumpkin(c, t, p);
  for (const c of list) if (c.kind === "ghost") paintGhost(c, t, p);
  for (const c of list) if (c.kind === "bat") paintBat(c, p);
}
