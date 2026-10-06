import fs from "node:fs";
import path from "node:path";
import { PANEL_DIR } from "@/lib/comicGen";

// Serves generated panel images from data/panels.
export async function GET(_req: Request, ctx: RouteContext<"/api/comic/panel/[file]">) {
  const { file } = await ctx.params;
  if (!/^[a-f0-9-]+-\d+\.png$/.test(file)) return new Response("Not found", { status: 404 });
  const full = path.join(PANEL_DIR, file);
  if (!fs.existsSync(full)) return new Response("Not found", { status: 404 });
  return new Response(fs.readFileSync(full), {
    headers: { "Content-Type": "image/png", "Cache-Control": "public, max-age=31536000, immutable" },
  });
}
