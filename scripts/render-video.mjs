// Render the pre-rendered Arrays video from our own app.
//
//   1. start the app:      npm run build && npx next start -p 3300
//   2. render:             node scripts/render-video.mjs [fps]      (default fps 8)
//
// Needs Chrome and ffmpeg on PATH (Windows: `winget install Gyan.FFmpeg`).
// It opens /render/arrays-video?record=1, steps a deterministic clock with window.__seek(t),
// screenshots every frame and encodes public/video/arrays.mp4.

import { spawn, spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const FPS = Number(process.argv[2] ?? 8);
const BASE = process.env.RENDER_BASE ?? "http://localhost:3300";
const CHROME = process.env.CHROME ?? "C:/Program Files/Google/Chrome/Application/chrome.exe";
const OUT = path.join("public", "video", "arrays.mp4");
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "algoverse-video-"));
const port = 9444;

if (spawnSync("ffmpeg", ["-version"]).status !== 0) {
  console.error("ffmpeg not found on PATH. Install it (winget install Gyan.FFmpeg) and open a new terminal.");
  process.exit(1);
}

const chrome = spawn(CHROME, [
  "--headless=new",
  `--remote-debugging-port=${port}`,
  "--disable-gpu",
  "--hide-scrollbars",
  `--user-data-dir=${path.join(tmp, "profile")}`,
  "--window-size=1280,720",
  "about:blank",
]);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

let target;
for (let i = 0; i < 60 && !target; i++) {
  try {
    target = (await (await fetch(`http://127.0.0.1:${port}/json`)).json()).find((t) => t.type === "page");
  } catch {}
  await sleep(250);
}
const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((r) => ws.addEventListener("open", r));
let seq = 0;
const pending = new Map();
ws.addEventListener("message", (e) => {
  const m = JSON.parse(e.data);
  if (m.id && pending.has(m.id)) {
    pending.get(m.id)(m);
    pending.delete(m.id);
  }
});
const send = (method, params = {}) =>
  new Promise((r) => {
    const id = ++seq;
    pending.set(id, r);
    ws.send(JSON.stringify({ id, method, params }));
  });

await send("Page.enable");
await send("Emulation.setDeviceMetricsOverride", { width: 1280, height: 720, deviceScaleFactor: 1, mobile: false });
await send("Page.navigate", { url: `${BASE}/render/arrays-video?record=1` });
await sleep(4000);
const dur = (await send("Runtime.evaluate", { expression: "window.__duration", returnByValue: true })).result.result.value;
if (!dur) {
  console.error("Render page did not load. Is the app running at", BASE, "?");
  process.exit(1);
}

const total = Math.ceil(dur * FPS);
for (let f = 0; f < total; f++) {
  await send("Runtime.evaluate", { expression: `window.__seek(${f / FPS})` });
  await sleep(40);
  const shot = await send("Page.captureScreenshot", { format: "png", clip: { x: 0, y: 0, width: 1280, height: 720, scale: 1 } });
  fs.writeFileSync(path.join(tmp, `f${String(f).padStart(5, "0")}.png`), Buffer.from(shot.result.data, "base64"));
  if (f % (FPS * 10) === 0) console.log(`frame ${f}/${total}`);
}
ws.close();
chrome.kill();

fs.mkdirSync(path.dirname(OUT), { recursive: true });
const enc = spawnSync(
  "ffmpeg",
  ["-y", "-framerate", String(FPS), "-i", path.join(tmp, "f%05d.png"), "-c:v", "libx264", "-pix_fmt", "yuv420p", "-r", "24", "-movflags", "+faststart", OUT],
  { stdio: "inherit" },
);
fs.rmSync(tmp, { recursive: true, force: true });
if (enc.status !== 0) process.exit(enc.status ?? 1);
console.log("written", OUT);
