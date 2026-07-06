import { neon } from "@neondatabase/serverless";

const POSTGRES_URL = process.env.POSTGRES_URL;
if (!POSTGRES_URL) { console.error("POSTGRES_URL missing"); process.exit(1); }

const sql = neon(POSTGRES_URL);

// Fetch all rows that were previously skipped (have fb_description + fb_publication_autor)
// and where autor_mix or autor_montage might still be null
const rows = await sql`
  SELECT id, player, movie, fb_publication_autor, autor_mix, autor_montage, fb_description
  FROM mixes
  WHERE fb_publication_autor IS NOT NULL
    AND fb_publication_autor <> ''
    AND fb_description IS NOT NULL
    AND fb_description <> ''
  ORDER BY fb_publication_date ASC
`;

// Patterns that indicate a DIFFERENT author is credited in the description
// (not the fb_publication_autor themselves)
const AUTHOR_PATTERNS = [
  /id[ée]e\s+(de|par)\s*:?\s*/i,
  /montage\s*(gui|guillaume)/i,
  /mix\s+by\s+(?!fb_publication)/i, // "Mix by X" where X is different
  /\bpar\s+:/i,
];

// IDs already manually corrected — don't overwrite
const ALREADY_FIXED = new Set([
  '5f76f214-8b9c-458d-907c-578887f29c37', // Croc Blanc (autor_mix = Toto Mota)
  'f74e149a-0823-4162-a695-a426e39e6024', // Terminator (autor_mix = Sandrine Ney)
  'ec116d57-b1e6-43e5-8566-445cc7751319', // Constance Nv (autor_montage = Guillaume)
  '3ebdeb84-5466-47f9-a246-9b0a0a48c982', // Constance Nv
  '5d678f58-b6fe-4f7f-9de8-49a09268d13e', // Constance Nv
]);

const withAuthor = [];
const withoutAuthor = [];

for (const row of rows) {
  if (ALREADY_FIXED.has(row.id)) continue;

  const desc = row.fb_description ?? "";
  const mentionsAuthor = AUTHOR_PATTERNS.some(p => p.test(desc));

  // Special case: "Mix by Toto" but fb_publication_autor != Toto → different author
  const mixByMatch = desc.match(/mix\s+by\s+(\w+)/i);
  const hasDifferentMixBy = mixByMatch && !row.fb_publication_autor?.toLowerCase().includes(mixByMatch[1].toLowerCase());

  // "Idée de Gregory Lenik" where Gregory Lenik != fb_publication_autor
  const ideaMatch = desc.match(/id[ée]e\s+(?:de|par)\s*:?\s*([\w\s']+)/i);
  const hasDifferentIdea = ideaMatch && !row.fb_publication_autor?.toLowerCase().includes(ideaMatch[1].trim().toLowerCase().split(" ")[0]);

  if (mentionsAuthor || hasDifferentMixBy || hasDifferentIdea) {
    withAuthor.push({ ...row, reason: desc.slice(0, 120) });
  } else {
    withoutAuthor.push(row);
  }
}

console.log("\n=== AVEC mention d'auteur (à ne PAS toucher) ===");
for (const r of withAuthor) {
  const label = [r.player, r.movie].filter(Boolean).join(" × ") || r.id;
  console.log(`  [${r.fb_publication_autor}] ${label}`);
  console.log(`    → "${r.reason}"`);
}

console.log(`\n=== SANS mention d'auteur → à mettre à jour (${withoutAuthor.length}) ===`);
for (const r of withoutAuthor) {
  const label = [r.player, r.movie].filter(Boolean).join(" × ") || r.id;
  console.log(`  [${r.fb_publication_autor}] ${label}`);
  console.log(`    desc: "${r.fb_description?.slice(0, 80)}"`);
}

// Perform the update
if (withoutAuthor.length > 0) {
  const ids = withoutAuthor.map(r => r.id);
  console.log(`\nApplying update to ${ids.length} rows…`);
  const result = await sql`
    UPDATE mixes
    SET
      autor_mix     = fb_publication_autor,
      autor_montage = fb_publication_autor,
      updated_at    = NOW()
    WHERE id = ANY(${ids})
    RETURNING id
  `;
  console.log(`✓ Updated ${result.length} rows.`);
}
