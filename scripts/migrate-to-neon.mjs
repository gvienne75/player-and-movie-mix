/**
 * One-time migration: copies all rows from Supabase → Neon PostgreSQL.
 * Run: POSTGRES_URL="..." node scripts/migrate-to-neon.mjs
 */

import { neon } from "@neondatabase/serverless";

const SUPABASE_URL = "https://ndhvpdaojmusezmhgxxn.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5kaHZwZGFvam11c2V6bWhneHhuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ3ODgwNDIsImV4cCI6MjA5MDM2NDA0Mn0.KV_uAJ_kYt7VEjic-vbQb-EqueWJ--iZ93M_IbzYgLI";
const POSTGRES_URL = process.env.POSTGRES_URL;

if (!POSTGRES_URL) {
  console.error("POSTGRES_URL is not set.");
  process.exit(1);
}

const sql = neon(POSTGRES_URL);

console.log("Creating mixes table if not exists…");
await sql`
  CREATE TABLE IF NOT EXISTS mixes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mix_name TEXT,
    player TEXT,
    movie TEXT,
    movie_year INTEGER,
    autor_mix TEXT,
    autor_montage TEXT,
    fb_publication_autor TEXT,
    fb_description TEXT,
    fb_url TEXT,
    image TEXT,
    fb_image TEXT,
    fb_publication_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  )
`;
await sql`CREATE INDEX IF NOT EXISTS mixes_created_at_idx ON mixes (created_at DESC)`;

console.log("Fetching rows from Supabase…");
const resp = await fetch(
  `${SUPABASE_URL}/rest/v1/mixes?select=*&order=created_at.desc&limit=2000`,
  {
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    },
  }
);
if (!resp.ok) {
  console.error("Supabase fetch failed:", resp.status, await resp.text());
  process.exit(1);
}

const mixes = await resp.json();
console.log(`Fetched ${mixes.length} rows. Inserting into Neon…`);

let inserted = 0;
let skipped = 0;
for (const m of mixes) {
  const result = await sql`
    INSERT INTO mixes (id, mix_name, player, movie, movie_year, autor_mix, autor_montage,
      fb_publication_autor, fb_description, fb_url, image, fb_image, fb_publication_date,
      created_at, updated_at)
    VALUES (
      ${m.id}, ${m.mix_name ?? null}, ${m.player ?? null}, ${m.movie ?? null},
      ${m.movie_year ?? null}, ${m.autor_mix ?? null}, ${m.autor_montage ?? null},
      ${m.fb_publication_autor ?? null}, ${m.fb_description ?? null}, ${m.fb_url ?? null},
      ${m.image ?? null}, ${m.fb_image ?? null}, ${m.fb_publication_date ?? null},
      ${m.created_at ?? null}, ${m.updated_at ?? null}
    )
    ON CONFLICT (id) DO NOTHING
    RETURNING id
  `;
  if (result.length > 0) inserted++;
  else skipped++;
}

console.log(`Done. Inserted: ${inserted}, Skipped (already exist): ${skipped}`);
