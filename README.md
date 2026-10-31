# Claire Tong — Portfolio

Next.js (static export) portfolio with an animated ASCII jellyfish background.

## Run it

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # writes the static site to /out
```

## Personalize

Almost everything lives in **`lib/site.ts`**: your name, role, about text, skills, projects, links, and your domain (`url`, used for SEO tags and the sitemap).

Also add:
- `public/Claire_Tong_Resume.pdf`: the Resume button links here
- `public/og.png` (1200×630): the preview image shown when your link is shared on LinkedIn, Slack, iMessage, etc.

## Deploy (free) on Vercel

1. Push this folder to a GitHub repo.
2. Go to vercel.com → **Add New Project** → import the repo → Deploy. No settings needed.
3. Optional: add your own domain in Vercel → Settings → Domains, then update `url` in `lib/site.ts`.
4. Submit `https://your-domain.com/sitemap.xml` in **Google Search Console** so Google indexes the site.

## How it's built

| File | What it does |
| --- | --- |
| `components/JellyfishCanvas.tsx` | The animation. A plain 2D canvas, with no Three.js. Each frame it moves the jellyfish, paints them into a brightness grid, and draws each cell as an ASCII character. It runs in `requestAnimationFrame` outside React state, so React never re-renders at 60fps. |
| `app/page.tsx` | Page content as real HTML text, so search engines can read it. |
| `app/layout.tsx` | SEO: title, description, Open Graph/Twitter cards, and Person structured data. |
| `app/sitemap.ts`, `app/robots.ts` | Generate `sitemap.xml` and `robots.txt`. |
| `app/globals.css` | Dark "deep sea" theme with glass panels. |

### Tuning the jellyfish

These are in `JellyfishCanvas.tsx`:
- `HUES`: the color palette
- `RAMP`: characters from dim to bright
- `CELL_W` / `CELL_H` / `FONT_SIZE`: character density
- In `makeJelly`: size (`r`), swim speed, tentacle count and length
- In `resize`: how many jellyfish appear (`count`)

It respects `prefers-reduced-motion`, showing a still frame for people who turn off animations.
