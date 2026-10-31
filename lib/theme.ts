export type Theme = "jellyfish" | "halloween";

/**
 * Which background to show. Runs in the browser, so it uses the visitor's
 * local date — no redeploy needed when the season changes.
 *
 * Override any day with ?theme=halloween or ?theme=jellyfish
 */
export function getTheme(now: Date = new Date()): Theme {
  try {
    const q = new URLSearchParams(window.location.search).get("theme");
    if (q === "halloween" || q === "jellyfish") return q;
  } catch {
    /* no window (server) */
  }
  const month = now.getMonth(); // 0 = Jan, 9 = Oct, 10 = Nov
  const day = now.getDate();
  // Halloween season: Oct 25 – Nov 1
  if ((month === 9 && day >= 25) || (month === 10 && day <= 1)) return "halloween";
  return "jellyfish";
}
