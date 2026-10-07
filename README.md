# AlgoVerse

DSA taught four ways — brief, comic, video, visualizer — from one knowledge file per topic.
Course project, 21CSE306P Applied Generative AI, SRM. Demo run-sheet: `DEMO.md`.

Live: https://algoverse-virid.vercel.app

## Run locally

```
npm install
# create .env.local with:  GEMINI_API_KEY=<your Gemini API key>
npm run dev
```

Open http://localhost:3000. Sign-in is mocked: any email works.

## Hosting (Vercel)

- The GitHub repo is connected to the Vercel project: every push to `main` deploys to production.
- The Gemini key is **never committed** (`.env*` is gitignored). It is stored in Vercel as an encrypted
  environment variable `GEMINI_API_KEY` (Production and Preview). To change it:
  `npx vercel env rm GEMINI_API_KEY production` then `npx vercel env add GEMINI_API_KEY production`, and redeploy.
- On Vercel the SQLite file lives in `/tmp` (per server instance), so progress and the regeneration cap can reset
  when an instance is recycled. Fine for a demo; use a hosted database for anything permanent.
- Gemini free tier ≈ 5 requests/minute and 20/day per model. The app falls back along a fixed model chain and,
  if all are busy, to the rule-based comic picker (shown honestly in the trace).

## Where things are

- `content/knowledge/*.md` — the facts. Every format reads from here.
- `content/comic-kit/` — the comic kit (layouts, palettes, designs, themes, poses) and fact-linked dialogue banks.
- `content/comics/<topic>/*.json` — hand-picked comics.
- `lib/viz/` — the visualizer engines (our own).
- `public/video/arrays.mp4` — the pre-rendered lesson (`scripts/render-video.mjs`).
- `data/algoverse.db` — SQLite, created on first run (local).

## Scripts

- `npm run check` — engine checks, comic-kit checks (word limits, fact links, scenes), banned-word scan.
- `npm run expand:bank -- <topic|all>` — grow dialogue banks with Gemini, gated by the checks.
- `npm run experiment` — constrained (kit) vs free generation; results show on `/insights`.
- `npm run seed:demo` — demo account with one regeneration left.
