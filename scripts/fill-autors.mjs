/**
 * Fill autor_mix and autor_montage with fb_publication_autor
 * for rows where those fields are NULL and fb_description is NULL.
 *
 * Run: node --env-file=.env.local scripts/fill-autors.mjs
 */

import { neon } from "@neondatabase/serverless";

const POSTGRES_URL = process.env.POSTGRES_URL;
if (!POSTGRES_URL) {
  console.error("POSTGRES_URL is not set. Run: vercel env pull .env.local first.");
  process.exit(1);
}

const sql = neon(POSTGRES_URL);

// --- Dry run: what would change ---
const toUpdate = await sql`
  SELECT
    id,
    player,
    movie,
    fb_publication_autor,
    autor_mix,
    autor_montage,
    fb_description
  FROM mixes
  WHERE
    fb_publication_autor IS NOT NULL
    AND fb_publication_autor <> ''
    AND (autor_mix IS NULL OR autor_mix = '')
    AND (autor_montage IS NULL OR autor_montage = '')
    AND (fb_description IS NULL OR fb_description = '')
  ORDER BY fb_publication_date ASC
`;

console.log(`\nRows to update: ${toUpdate.length}`);
console.log("─".repeat(80));
for (const row of toUpdate) {
  const label = [row.player, row.movie].filter(Boolean).join(" × ") || row.id;
  console.log(`  ${label} → autor_mix = autor_montage = "${row.fb_publication_autor}"`);
}

if (toUpdate.length === 0) {
  console.log("Nothing to update.");
  process.exit(0);
}

console.log("\nApplying…");

const result = await sql`
  UPDATE mixes
  SET
    autor_mix     = fb_publication_autor,
    autor_montage = fb_publication_autor,
    updated_at    = NOW()
  WHERE
    fb_publication_autor IS NOT NULL
    AND fb_publication_autor <> ''
    AND (autor_mix IS NULL OR autor_mix = '')
    AND (autor_montage IS NULL OR autor_montage = '')
    AND (fb_description IS NULL OR fb_description = '')
  RETURNING id
`;

console.log(`✓ Updated ${result.length} rows.`);

// --- Rows skipped because fb_description is set ---
const skipped = await sql`
  SELECT
    id,
    player,
    movie,
    fb_publication_autor,
    autor_mix,
    autor_montage,
    fb_description
  FROM mixes
  WHERE
    fb_publication_autor IS NOT NULL
    AND fb_publication_autor <> ''
    AND (autor_mix IS NULL OR autor_mix = '')
    AND (autor_montage IS NULL OR autor_montage = '')
    AND fb_description IS NOT NULL
    AND fb_description <> ''
  ORDER BY fb_publication_date ASC
`;

if (skipped.length > 0) {
  console.log(`\n⚠  ${skipped.length} rows skipped (fb_description has content):`);
  console.log("─".repeat(80));
  for (const row of skipped) {
    const label = [row.player, row.movie].filter(Boolean).join(" × ") || row.id;
    console.log(`  ${label}`);
    console.log(`    fb_publication_autor: ${row.fb_publication_autor}`);
    console.log(`    fb_description: ${row.fb_description?.slice(0, 100)}…`);
  }
}

console.log("\nDone.");
