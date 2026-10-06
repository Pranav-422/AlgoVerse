// Fails if any review-banned word appears in source, content or docs we ship.
//   npm run check:words
import fs from "node:fs";
import path from "node:path";

// Built from parts so this file does not match itself.
const WORDS = ["ag" + "ent", "ag" + "ents", "ag" + "entic", "multi-ag" + "ent", "auton" + "omous", "plan" + "ner"];
const RE = new RegExp(`\\b(${WORDS.join("|")})\\b`, "i");
// Planning docs (../PRD.md etc.) are not shipped and state the rule itself, so they are not scanned.
const ROOTS = ["app", "components", "lib", "content", "scripts", "README.md", "DEMO.md"];
const SKIP = new Set(["node_modules", ".next", "data"]);

const hits = [];
function walk(p) {
  if (!fs.existsSync(p)) return;
  const st = fs.statSync(p);
  if (st.isDirectory()) {
    for (const f of fs.readdirSync(p)) if (!SKIP.has(f)) walk(path.join(p, f));
    return;
  }
  if (!/\.(tsx?|mjs|mts|json|md|css)$/.test(p)) return;
  fs.readFileSync(p, "utf8")
    .split("\n")
    .forEach((line, i) => {
      if (RE.test(line)) hits.push(`${p}:${i + 1}: ${line.trim().slice(0, 120)}`);
    });
}
ROOTS.forEach(walk);
if (hits.length) {
  console.log(hits.join("\n"));
  console.log(`${hits.length} banned-word hit(s).`);
  process.exit(1);
}
console.log("no banned words");
