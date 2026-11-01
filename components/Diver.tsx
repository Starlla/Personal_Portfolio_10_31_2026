"use client";

import { useEffect, useRef } from "react";
import { getTheme } from "@/lib/theme";

/**
 * A little ASCII diver on the right edge (wide screens only).
 * - Sinks as the page scrolls, with a depth gauge.
 * - "dive ↓" jumps to the next section with a burst of bubbles.
 * - At the bottom it becomes "surface ↑" and swims back to the top.
 *
 * Like the jellyfish, everything after the first render is plain DOM work
 * inside useEffect, so scrolling never re-renders React.
 */

// Head-down diver: fins up top, round helmet + snorkel bottom-left.
// DIVER_COLORS is a same-size "paint" mask for DIVER_ART:
//   b fins · g legs · t belt · d suit · h helmet · v visor · s snorkel · p mouthpiece · k hands
const DIVER_ART = [
  String.raw`             _      _   `,
  String.raw`            /#|    /#|  `,
  String.raw`           /##/   /##/  `,
  String.raw`           \%%\  /%%/   `,
  String.raw`            \%%\/%%/    `,
  String.raw`             \%%%%%/    `,
  String.raw`             |=====|    `,
  String.raw`            /#####/     `,
  String.raw`     _     /#####/      `,
  String.raw`    |o|   /#####/\      `,
  String.raw`    |_|  /#####/##\     `,
  String.raw`   .-+-./#####/  \#\    `,
  String.raw`  /  .---.  \ /   \#\   `,
  String.raw` |  ( === )  |     \#\  `,
  String.raw`  \  '---'  /##\    (@) `,
  String.raw`   '-------'  \#\       `,
  String.raw`               (@)      `,
];
const DIVER_COLORS = [
  String.raw`             b      b   `,
  String.raw`            bbbb   bbbb `,
  String.raw`           bbbb   bbbb  `,
  String.raw`           gggg  gggg   `,
  String.raw`            gggggggg    `,
  String.raw`             ggggggg    `,
  String.raw`             ttttttt    `,
  String.raw`            ddddddd     `,
  String.raw`     s     ddddddd      `,
  String.raw`    sss   dddddddd      `,
  String.raw`    ppp  ddddddddddd    `,
  String.raw`   hhphhddddddd  ddd    `,
  String.raw`  h  vvvvv  h d   ddd   `,
  String.raw` h  vvvvvvv  h     ddd  `,
  String.raw`  h  vvvvv  hddd    kkk `,
  String.raw`   hhhhhhhhh  ddd       `,
  String.raw`               kkk      `,
];

/** Split each art row into runs of the same color for <span>s. */
const DIVER_ROWS = DIVER_ART.map((row, r) => {
  const mask = DIVER_COLORS[r];
  const runs: { text: string; color: string }[] = [];
  for (let i = 0; i < row.length; i++) {
    const color = mask[i] === " " ? "" : mask[i];
    const last = runs[runs.length - 1];
    if (last && last.color === color) last.text += row[i];
    else runs.push({ text: row[i], color });
  }
  return runs;
});

const BUBBLE_CHARS = ["o", "°", "∘", "O", "·", "o"];
const MAX_DEPTH_M = 200;
const NAV_OFFSET = 72; // keep section headings clear of the sticky nav

const rand = (a: number, b: number) => a + Math.random() * (b - a);

export default function Diver() {
  const rootRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    // The diver sits out the Halloween season (hidden via CSS too).
    if (getTheme() === "halloween") return;
    const bubbles = root.querySelector<HTMLElement>("[data-bubbles]");
    const depthEl = root.querySelector<HTMLElement>("[data-depth]");
    const btn = root.querySelector<HTMLButtonElement>("[data-dive]");
    if (!bubbles || !depthEl || !btn) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let atBottom = false;
    let ticking = false;
    let poseTimer = 0;

    function update() {
      ticking = false;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const p = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
      root!.style.setProperty("--depth", p.toFixed(4));
      depthEl!.textContent = String(Math.round(p * MAX_DEPTH_M)).padStart(3, "0");
      const bottom = p > 0.98;
      if (bottom !== atBottom) {
        atBottom = bottom;
        btn!.textContent = atBottom ? "surface ↑" : "dive ↓";
        btn!.setAttribute("aria-label", atBottom ? "Swim back to the top" : "Dive to the next section");
      }
    }

    function onScroll() {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    }

    function spawnBubbles(count: number, gapMs: number, big = false) {
      if (reduceMotion || document.hidden) return;
      for (let i = 0; i < count; i++) {
        window.setTimeout(() => {
          const b = document.createElement("span");
          b.className = "bubble";
          b.textContent = BUBBLE_CHARS[Math.floor(Math.random() * BUBBLE_CHARS.length)];
          b.style.setProperty("--x", `${rand(-10, 10).toFixed(1)}px`);
          b.style.setProperty("--drift", `${rand(-22, 22).toFixed(1)}px`);
          b.style.setProperty("--size", `${(big ? rand(10, 18) : rand(8, 12)).toFixed(1)}px`);
          b.style.setProperty("--dur", `${(big ? rand(1.4, 2.4) : rand(2.2, 3.2)).toFixed(2)}s`);
          b.addEventListener("animationend", () => b.remove());
          bubbles!.appendChild(b);
        }, i * gapMs);
      }
    }

    function nextSection(): HTMLElement | null {
      const sections = Array.from(document.querySelectorAll<HTMLElement>("main > section"));
      return sections.find((s) => s.getBoundingClientRect().top > NAV_OFFSET + 8) ?? null;
    }

    function onDive() {
      const target = atBottom ? null : nextSection();
      const top = target ? target.getBoundingClientRect().top + window.scrollY - NAV_OFFSET : 0;

      // Restart the pose animation even on rapid clicks.
      root!.classList.remove("is-diving", "is-surfacing");
      void root!.offsetWidth;
      root!.classList.add(target ? "is-diving" : "is-surfacing");
      window.clearTimeout(poseTimer);
      poseTimer = window.setTimeout(() => root!.classList.remove("is-diving", "is-surfacing"), 1400);

      spawnBubbles(target ? 14 : 22, target ? 60 : 40, true);
      window.scrollTo({ top, behavior: reduceMotion ? "auto" : "smooth" });
    }

    // An occasional lazy bubble while idle.
    const idle = window.setInterval(() => spawnBubbles(Math.random() < 0.4 ? 2 : 1, 280), 2600);

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    btn.addEventListener("click", onDive);

    return () => {
      window.clearInterval(idle);
      window.clearTimeout(poseTimer);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      btn.removeEventListener("click", onDive);
    };
  }, []);

  return (
    <aside ref={rootRef} className="diver" aria-label="Dive navigation">
      <div className="diver-swimmer">
        <div className="diver-figure">
          <div className="diver-bubbles" data-bubbles aria-hidden="true" />
          <pre className="diver-art" aria-hidden="true">
            {DIVER_ROWS.map((runs, r) => (
              <span key={r} className="diver-row">
                {runs.map((run, i) =>
                  run.color ? <span key={i} className={`dv-${run.color}`}>{run.text}</span> : run.text
                )}
                {"\n"}
              </span>
            ))}
          </pre>
        </div>
        <p className="diver-gauge" aria-hidden="true">
          depth <b data-depth>000</b> m
        </p>
        <button type="button" className="diver-btn" data-dive aria-label="Dive to the next section">
          dive ↓
        </button>
      </div>
    </aside>
  );
}
