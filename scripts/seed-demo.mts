// Prepare the demo account in the local database.
//   npm run seed:demo
// Creates demo@srm.edu with a learning style, some progress, one quiz answer, and the
// Arrays comic regeneration count at 2 — so on stage one regeneration still works and the
// next one shows the limit message with its reset time, in under a minute.
import { findOrCreateUser, markProgress, savePreferences, checkAndIncrementAttempt, recordQuiz } from "../lib/db.ts";

const EMAIL = "demo@srm.edu";
const user = findOrCreateUser(EMAIL);
savePreferences(user.id, { length: "short", style: "visual", pace: "story" });
markProgress(user.id, "arrays", "brief");
markProgress(user.id, "arrays", "visualizer");
markProgress(user.id, "linked-lists", "brief");
recordQuiz(user.id, "arrays", "access", true);

// Bring the Arrays cap to exactly 2 used (works from any starting state inside the window).
let r = checkAndIncrementAttempt(user.id, "arrays");
while (r.allowed && r.remaining > 1) r = checkAndIncrementAttempt(user.id, "arrays");
console.log(`Seeded ${EMAIL} (${user.id}). Arrays regenerations left: ${r.allowed ? r.remaining : 0}.`);
