# AlgoVerse

DSA taught four ways — brief, comic, video, visualizer — from one knowledge file per topic.
Course project, 21CSE306P Applied Generative AI, SRM. See `../PRD.md`, `../SPEC.md`, `../TASKS.md`.

## Run

```
npm install
# put your key in .env.local:  GEMINI_API_KEY=...
npm run dev
```

Open http://localhost:3000. Sign-in is mocked: any email works.

- `content/knowledge/*.md` — the facts. Every format reads from here.
- `content/comics/<topic>/*.json` — pre-made comic pool.
- `public/video/arrays.mp4` — drop the pre-rendered lesson here.
- `data/algoverse.db` — SQLite, created on first run.
- `COMIC_IMAGES=on` in `.env.local` enables panel image generation (only after the Phase 5 spike passes).

- `lib/viz/` — the visualizer engines (our own). `node scripts/check-engines.mts` runs their sanity checks.
