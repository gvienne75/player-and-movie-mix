import { neon } from "@neondatabase/serverless";
import { createWriteStream, mkdirSync } from "fs";
import { pipeline } from "stream/promises";
import { Readable } from "stream";
import { extname } from "path";
import { config } from "dotenv";

config({ path: ".env" });

const sql = neon(process.env.POSTGRES_URL);
const OUT_DIR = "downloads/images";
mkdirSync(OUT_DIR, { recursive: true });

const mixes = await sql`
  SELECT id, image, fb_image, rank
  FROM (
    SELECT *, ROW_NUMBER() OVER (ORDER BY COALESCE(fb_publication_date::text, '') ASC) AS rank
    FROM mixes
  ) ranked
  ORDER BY rank ASC
`;

let ok = 0, skipped = 0, failed = 0;

for (const mix of mixes) {
  const rank = String(mix.rank).padStart(3, "0");
  const url = mix.image ?? mix.fb_image;

  if (!url) {
    console.log(`  ${rank} — no image, skipping`);
    skipped++;
    continue;
  }

  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const contentType = res.headers.get("content-type") ?? "";
    let ext = extname(new URL(url).pathname).toLowerCase().replace(/\?.*$/, "") || ".jpg";
    if (!ext || ext.length > 5) {
      if (contentType.includes("png")) ext = ".png";
      else if (contentType.includes("gif")) ext = ".gif";
      else if (contentType.includes("webp")) ext = ".webp";
      else ext = ".jpg";
    }

    const dest = `${OUT_DIR}/${rank}${ext}`;
    await pipeline(Readable.fromWeb(res.body), createWriteStream(dest));
    console.log(`✓ ${rank}${ext}  (${mix.id})`);
    ok++;
  } catch (err) {
    console.error(`✗ ${rank} — ${err.message}  (${url})`);
    failed++;
  }
}

console.log(`\nDone: ${ok} downloaded, ${skipped} skipped (no url), ${failed} failed`);
