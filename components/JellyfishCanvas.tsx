"use client";

import { useEffect, useRef } from "react";

/**
 * ASCII jellyfish rendered on a 2D canvas.
 *
 * How it works, each frame:
 *  1. Move every jellyfish (pulse-driven swimming, drift, gentle pull toward the pointer).
 *  2. "Paint" each jellyfish into a brightness grid — one value per text cell.
 *  3. Turn each cell's brightness into a character from RAMP and draw it with fillText.
 *
 * The animation runs outside React state (refs + requestAnimationFrame),
 * so React never re-renders at 60fps.
 */

const RAMP = " .,:;-~=+*o#%@";
const FONT_SIZE = 13;
const CELL_W = 8;
const CELL_H = 14;
const LEVELS = 10; // brightness buckets, used to batch draw calls
const BG = "#07090d";

// Bioluminescent palette (HSL hues)
const HUES = [188, 275, 318, 165, 212];

type Jelly = {
  x: number; // bell rim center, px
  y: number;
  r: number; // bell radius, px
  phase: number;
  pulseRate: number;
  speed: number;
  hueIdx: number;
  vx: number;
  seed: number;
  tentacles: number;
  length: number; // tentacle length, px
};

type Snow = { x: number; y: number; v: number; tw: number };

const rand = (a: number, b: number) => a + Math.random() * (b - a);
const smoothstep = (e0: number, e1: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0)));
  return t * t * (3 - 2 * t);
};

function makeJelly(w: number, h: number, y?: number): Jelly {
  const r = rand(60, 130) * Math.min(1, Math.max(0.55, w / 1300));
  return {
    x: rand(r, w - r),
    y: y ?? h + r + rand(0, h * 0.3),
    r,
    phase: rand(0, Math.PI * 2),
    pulseRate: rand(1.4, 2.2),
    speed: rand(14, 30),
    hueIdx: Math.floor(Math.random() * HUES.length),
    vx: 0,
    seed: rand(0, 1000),
    tentacles: Math.floor(rand(7, 11)),
    length: r * rand(2.6, 3.8),
  };
}

export default function JellyfishCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let w = 0, h = 0, cols = 0, rows = 0;
    let bright = new Float32Array(0);
    let hueOf = new Uint8Array(0);
    let jellies: Jelly[] = [];
    let snow: Snow[] = [];
    const pointer = { x: -9999, y: -9999, active: false };

    // Reusable per-frame buckets: [hueIdx][level] -> flat list of col,row pairs
    const buckets: number[][] = Array.from({ length: HUES.length * LEVELS }, () => []);

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = window.innerWidth;
      h = window.innerHeight;
      canvas!.width = Math.floor(w * dpr);
      canvas!.height = Math.floor(h * dpr);
      canvas!.style.width = `${w}px`;
      canvas!.style.height = `${h}px`;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx!.font = `${FONT_SIZE}px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace`;
      ctx!.textBaseline = "top";

      cols = Math.ceil(w / CELL_W);
      rows = Math.ceil(h / CELL_H);
      bright = new Float32Array(cols * rows);
      hueOf = new Uint8Array(cols * rows);

      const count = Math.round(Math.min(7, Math.max(3, (w * h) / 200000)));
      jellies = Array.from({ length: count }, (_, i) =>
        makeJelly(w, h, ((i + 0.5) / count) * h * 1.1 + rand(-40, 40))
      );
      snow = Array.from({ length: Math.round((w * h) / 14000) }, () => ({
        x: rand(0, w), y: rand(0, h), v: rand(3, 10), tw: rand(0, 6.28),
      }));
    }

    function plot(px: number, py: number, val: number, hueIdx: number) {
      const c = (px / CELL_W) | 0;
      const r = (py / CELL_H) | 0;
      if (c < 0 || r < 0 || c >= cols || r >= rows) return;
      const i = r * cols + c;
      if (val > bright[i]) {
        bright[i] = val;
        hueOf[i] = hueIdx;
      }
    }

    function paintJelly(j: Jelly, t: number) {
      const pulse = Math.sin(j.phase);
      const sx = 1 + 0.13 * pulse; // bell widens...
      const sy = 1 - 0.13 * pulse; // ...as it flattens
      const domeH = j.r * 0.85 * sy;
      const halfW = j.r * sx;
      const glow = 0.82 + 0.18 * Math.max(0, -pulse);

      // --- Bell (dome) ---
      const c0 = Math.max(0, ((j.x - halfW) / CELL_W) | 0);
      const c1 = Math.min(cols - 1, ((j.x + halfW) / CELL_W) | 0);
      const r0 = Math.max(0, ((j.y - domeH) / CELL_H) | 0);
      const r1 = Math.min(rows - 1, ((j.y + j.r * 0.12) / CELL_H) | 0);
      for (let r = r0; r <= r1; r++) {
        const py = r * CELL_H + CELL_H / 2;
        for (let c = c0; c <= c1; c++) {
          const px = c * CELL_W + CELL_W / 2;
          const nx = (px - j.x) / halfW;
          let ny = (py - j.y) / domeH;
          if (ny > 0) ny *= 5; // flat skirt under the rim
          const d = Math.hypot(nx, ny);
          if (d > 1) continue;
          const ang = Math.atan2(ny, nx);
          const rim = smoothstep(0.7, 1, d) * 0.95;
          const ribs = 0.32 + 0.16 * Math.sin(ang * 9 + t * 0.6);
          const gonad =
            Math.exp(-(((d - 0.42) / 0.09) ** 2)) * 0.45 * (0.55 + 0.45 * Math.sin(ang * 4 - t));
          const v = (Math.max(rim, ribs * (1 - 0.3 * d)) + gonad) * glow;
          const i = r * cols + c;
          if (v > bright[i]) {
            bright[i] = v;
            hueOf[i] = j.hueIdx;
          }
        }
      }

      // --- Thin tentacles from the rim ---
      const contract = 1 - 0.18 * pulse;
      const step = CELL_H * 0.55;
      for (let k = 0; k < j.tentacles; k++) {
        const u = j.tentacles === 1 ? 0 : (k / (j.tentacles - 1)) * 2 - 1;
        const bx = j.x + u * halfW * 0.92;
        const L = j.length * (0.75 + 0.25 * Math.sin(j.seed + k * 2.3));
        for (let s = 0; s < L; s += step) {
          const f = s / L;
          const sway =
            Math.sin(s * 0.03 - t * 2.1 + k * 1.7 + j.seed) * (4 + 20 * f) -
            j.vx * 0.6 * f; // trail behind sideways motion
          const v = Math.pow(1 - f, 1.2) * 0.85 * glow;
          plot(bx + sway, j.y + s * contract, v, j.hueIdx);
        }
      }

      // --- Frilly oral arms from the center ---
      for (let k = 0; k < 4; k++) {
        const u = (k / 3) * 2 - 1;
        const bx = j.x + u * halfW * 0.28;
        const L = j.r * (1.4 + 0.3 * Math.sin(j.seed + k));
        for (let s = 0; s < L; s += step) {
          const f = s / L;
          const sway = Math.sin(s * 0.05 - t * 1.6 + k * 2.1 + j.seed) * (3 + 10 * f) - j.vx * 0.4 * f;
          const frill = Math.sin(s * 0.25 + t * 3 + k) * 3 * (1 - f);
          const v = (0.95 - 0.6 * f) * glow;
          const py = j.y + s * contract;
          plot(bx + sway, py, v, j.hueIdx);
          plot(bx + sway + CELL_W * 0.9 + frill, py, v * 0.6, j.hueIdx);
        }
      }
    }

    function update(dt: number, t: number) {
      for (const j of jellies) {
        j.phase += dt * j.pulseRate;
        // Thrust happens while the bell contracts.
        const thrust = 0.25 + 1.1 * Math.max(0, Math.cos(j.phase));
        j.y -= j.speed * thrust * dt;

        // Gentle curiosity: drift toward the pointer when it's near.
        if (pointer.active) {
          const dx = pointer.x - j.x;
          const dy = pointer.y - (j.y - j.r * 0.4);
          const dist = Math.hypot(dx, dy);
          if (dist < 380 && dist > 1) {
            const pull = (1 - dist / 380) * 40;
            j.vx += (dx / dist) * pull * dt;
            j.y += (dy / dist) * pull * 0.35 * dt;
          }
        }
        j.vx += Math.sin(t * 0.25 + j.seed) * 6 * dt; // ocean current
        j.vx *= 1 - 0.9 * dt;
        j.x += j.vx * dt;

        // Wrap: off the top -> respawn below the screen.
        if (j.y + j.length < 0) Object.assign(j, makeJelly(w, h));
        if (j.x < -j.r) j.x = w + j.r;
        if (j.x > w + j.r) j.x = -j.r;
      }
      for (const p of snow) {
        p.y -= p.v * dt;
        p.x += Math.sin(t * 0.5 + p.tw) * 3 * dt;
        if (p.y < -10) { p.y = h + 10; p.x = rand(0, w); }
      }
    }

    function draw(t: number) {
      bright.fill(0);
      for (const j of jellies) paintJelly(j, t);

      for (const b of buckets) b.length = 0;
      for (let i = 0; i < bright.length; i++) {
        const v = bright[i];
        if (v < 0.06) continue;
        const lvl = Math.min(LEVELS - 1, (v * LEVELS) | 0);
        buckets[hueOf[i] * LEVELS + lvl].push(i);
      }

      ctx!.fillStyle = BG;
      ctx!.fillRect(0, 0, w, h);

      // Marine snow
      ctx!.shadowBlur = 0;
      for (const p of snow) {
        const a = 0.12 + 0.12 * Math.sin(t * 2 + p.tw);
        ctx!.fillStyle = `rgba(160,200,230,${a.toFixed(3)})`;
        ctx!.fillText(".", p.x, p.y);
      }

      // Jellyfish, batched by color to keep draw calls low
      for (let hIdx = 0; hIdx < HUES.length; hIdx++) {
        const hue = HUES[hIdx];
        for (let lvl = 0; lvl < LEVELS; lvl++) {
          const cells = buckets[hIdx * LEVELS + lvl];
          if (!cells.length) continue;
          const v = (lvl + 0.5) / LEVELS;
          const ch = RAMP[Math.min(RAMP.length - 1, Math.round(v * (RAMP.length - 1)))];
          const light = 45 + 45 * v;
          ctx!.fillStyle = `hsla(${hue}, 90%, ${light}%, ${0.45 + 0.55 * v})`;
          if (lvl >= LEVELS - 3) {
            ctx!.shadowColor = `hsla(${hue}, 100%, 65%, 0.9)`;
            ctx!.shadowBlur = 10;
          } else {
            ctx!.shadowBlur = 0;
          }
          for (const i of cells) {
            const c = i % cols;
            const r = (i / cols) | 0;
            ctx!.fillText(ch, c * CELL_W, r * CELL_H);
          }
        }
      }
      ctx!.shadowBlur = 0;
    }

    let raf = 0;
    let last = performance.now();
    const start = last;
    function frame(now: number) {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const t = (now - start) / 1000;
      update(dt, t);
      draw(t);
      raf = requestAnimationFrame(frame);
    }

    const onMove = (e: PointerEvent) => {
      pointer.x = e.clientX;
      pointer.y = e.clientY;
      pointer.active = true;
    };
    const onLeave = () => { pointer.active = false; };
    let resizeTimer = 0;
    const onResize = () => {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(() => { resize(); if (reduceMotion) draw(0); }, 120);
    };

    resize();
    window.addEventListener("resize", onResize);
    if (reduceMotion) {
      draw(0); // a still frame for people who prefer less motion
    } else {
      window.addEventListener("pointermove", onMove);
      document.addEventListener("pointerleave", onLeave);
      raf = requestAnimationFrame(frame);
    }

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  return <canvas ref={canvasRef} className="jelly-canvas" aria-hidden="true" />;
}
