/**
 * Uploads images 216-219 to Supabase Storage and inserts new rows in Neon DB.
 * Requires SUPABASE_SERVICE_KEY in .env (Settings → API → service_role in Supabase dashboard).
 * Run: node scripts/add-images.mjs
 */

import { neon } from "@neondatabase/serverless";
import { readFile } from "fs/promises";
import { extname } from "path";
import { config } from "dotenv";

config({ path: ".env" });

const SUPABASE_URL = "https://ndhvpdaojmusezmhgxxn.supabase.co";
const SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
const POSTGRES_URL = process.env.POSTGRES_URL;
const IMAGES_DIR = "downloads/images";
const BUCKET = "mixes-images";

if (!SERVICE_KEY) {
  console.error("SUPABASE_SERVICE_KEY manquant dans .env");
  process.exit(1);
}
if (!POSTGRES_URL) {
  console.error("POSTGRES_URL manquant dans .env");
  process.exit(1);
}

const sql = neon(POSTGRES_URL);

const files = ["216.png", "217.png", "218.png", "219.png"];

for (const filename of files) {
  const rank = filename.replace(/\.\w+$/, "");
  const ext = extname(filename).slice(1);
  const contentType = ext === "png" ? "image/png" : "image/jpeg";

  // 1. Upload image to Supabase Storage
  console.log(`\nUploading ${filename}…`);
  const data = await readFile(`${IMAGES_DIR}/${filename}`);

  const uploadRes = await fetch(
    `${SUPABASE_URL}/storage/v1/object/${BUCKET}/${filename}`,
    {
      method: "POST",
      headers: {
        apikey: SERVICE_KEY,
        Authorization: `Bearer ${SERVICE_KEY}`,
        "Content-Type": contentType,
      },
      body: data,
    }
  );

  if (!uploadRes.ok) {
    const err = await uploadRes.text();
    console.error(`  ✗ Upload failed: ${err}`);
    continue;
  }

  const imageUrl = `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${filename}`;
  console.log(`  ✓ Uploaded → ${imageUrl}`);

  // 2. Insert new row in Neon DB (all metadata fields null — to fill via UI)
  const inserted = await sql`
    INSERT INTO mixes (image, created_at, updated_at)
    VALUES (${imageUrl}, NOW(), NOW())
    RETURNING id
  `;

  console.log(`  ✓ Row inserted — id: ${inserted[0].id}`);
}

console.log("\nDone. Fill in player/movie/etc. in the UI.");
