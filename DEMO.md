# AlgoVerse — demo run-sheet

Target: 8–10 minutes. Practise it twice on the demo laptop and network.

## Before the review (day before)

1. `npm install`, then put the Gemini key in `.env.local`: `GEMINI_API_KEY=...`
2. `npm run check` → must print `all engine checks passed`, `comic kit OK`, `no banned words`.
3. `npm run experiment` (≈10 min) → fills the experiment table on **/insights** with real numbers.
4. Generate a few comics and rewrites while signed in, so **/insights** has real traffic.
5. Render the video: `npm run build && npx next start -p 3300`, then in a second terminal `node scripts/render-video.mjs`
   (needs ffmpeg: `winget install Gyan.FFmpeg`). Output: `public/video/arrays.mp4`.
6. `npm run seed:demo` → demo@srm.edu with a learning style and **1** Arrays regeneration left.
7. Record a 3-minute screen capture of the full path as a backup in case the network fails.

## Gemini free tier — plan around it

- Free tier ≈ **5 requests/minute and 20 requests/day per model**. Each comic regenerate or brief rewrite is 1 request (more if a model is busy).
- The app uses a fixed chain `gemini-3.8-flash → gemini-3.5-flash-lite → gemini-3.6-flash`; a busy or rate-limited model is skipped automatically and the trace shows which model answered.
- Do **not** run `npm run experiment` or `npm run expand:bank` on demo day — they spend the daily quota. Run them the day before.
- If every model is out, comics still work through the rule-based fallback, and the trace says so honestly.
- For the live site, add the key in Vercel once: `npx vercel env add GEMINI_API_KEY production`, then redeploy.

## On stage

| # | Time | Show | Say (one line) |
|---|------|------|----------------|
| 1 | 0:00 | Landing → sign in as `demo@srm.edu` | "One topic, four formats, one source of facts." |
| 2 | 0:40 | Dashboard: learning style, progress, quiz mastery | "The app knows how this learner likes to learn." |
| 3 | 1:10 | Arrays brief → **Make it more expressive** → open *How this was generated* | "Gemini rewrites the summary; the fact guard checks every number and Big-O against the knowledge file." |
| 4 | 2:10 | **Explain in Hinglish** | "Same guard, different language." |
| 5 | 2:40 | Visualizer: Binary search, step back/forward, pseudocode line | "Frames come from our own deterministic engine — no model involved, so it is always correct." |
| 6 | 3:40 | Comic: deck, swipe, page view, read-aloud, quiz at the end | "A comic is assembled from a prepared kit: layouts, palettes, poses and a fact-linked dialogue bank." |
| 7 | 4:40 | Press **too complex** → Regenerate → open the trace | "Gemini only returns ids. We rule-check them; feedback becomes a hard rule — 4 panels, basic lines only." |
| 8 | 5:40 | Press Regenerate again → limit message with reset time | "Three regenerations per topic per day; free-tier honest." |
| 9 | 6:10 | **/insights**: reliability tiles, outcome bar, experiment table | "Measured, not claimed: first-try validity, retries, fallbacks — and why we constrained the model." |
| 10 | 7:10 | **/consistency** | "Every fact, every place it is used. This is the consistency problem from our PRD, solved and visible." |
| 11 | 7:50 | Video page with chapters | "Pre-rendered from our own visualizer and the same facts — labelled as pre-rendered." |

## If something breaks

- No network / Gemini down → comics still work: the rule-based fallback picks, and the trace says so honestly.
- Gemini rate-limited → same as above; rewrites show the original summary with the reason.
- Anything else → play the backup recording.

## Words to avoid on slides and in speech

Describe the system as an **orchestrated pipeline**: a gateway routes each request to independent services, each with a timeout and a fallback.
Do not describe any part as self-directing — every model call is one bounded step with a fixed prompt template.
