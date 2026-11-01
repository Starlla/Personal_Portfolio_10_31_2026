"use client";

import { useEffect, useRef } from "react";

/**
 * "I build <rotating phrase>" — the phrase swaps every few seconds, each word
 * blurring out and then blurring back in one after another.
 *
 * The server-rendered HTML contains the first phrase plus a visually hidden
 * sentence with every phrase, so search engines and screen readers get the
 * full text without the animation.
 */
type Props = { prefix: string; phrases: string[] };

const HOLD_MS = 3200;   // how long each phrase stays
const WORD_IN_MS = 90;  // stagger between words blurring in
const WORD_OUT_MS = 40; // stagger between words blurring out
const FADE_MS = 520;    // per-word transition length (matches CSS)

export default function RotatingSubtitle({ prefix, phrases }: Props) {
  const slotRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const slot = slotRef.current;
    if (!slot || phrases.length < 2) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let index = 0;
    const timers: number[] = [];
    const later = (fn: () => void, ms: number) => timers.push(window.setTimeout(fn, ms));

    function renderWords(text: string, entering: boolean) {
      slot!.textContent = "";
      text.split(" ").forEach((word, i, all) => {
        const span = document.createElement("span");
        span.className = entering ? "rot-word is-hidden" : "rot-word";
        span.textContent = word;
        slot!.appendChild(span);
        if (i < all.length - 1) slot!.appendChild(document.createTextNode(" "));
        if (entering) later(() => span.classList.remove("is-hidden"), 30 + i * WORD_IN_MS);
      });
    }

    function next() {
      const words = Array.from(slot!.querySelectorAll<HTMLElement>(".rot-word"));
      words.forEach((w, i) => later(() => w.classList.add("is-leaving"), i * WORD_OUT_MS));
      const outDone = words.length * WORD_OUT_MS + FADE_MS * 0.7;
      later(() => {
        index = (index + 1) % phrases.length;
        renderWords(phrases[index], true);
        later(next, HOLD_MS);
      }, outDone);
    }

    later(next, HOLD_MS);
    return () => timers.forEach((t) => window.clearTimeout(t));
  }, [phrases]);

  return (
    <h2 className="subtitle">
      <span className="visually-hidden">
        {prefix} {phrases.join(", ")}.
      </span>
      <span aria-hidden="true">
        <span className="subtitle-prefix">{prefix} </span>
        <span className="subtitle-rot" ref={slotRef}>
          {phrases[0].split(" ").map((w, i, all) => (
            <span key={i}>
              <span className="rot-word">{w}</span>
              {i < all.length - 1 ? " " : ""}
            </span>
          ))}
        </span>
      </span>
    </h2>
  );
}
