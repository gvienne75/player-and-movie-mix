/**
 * Corrects autor_mix / autor_montage based on info extracted from fb_description.
 *
 * Aliases resolved:
 *   Gui / GUi   → Guillaume Agenouiller
 *   Greg V.     → Grégoire Vienne
 *   SCAL / Scal → Paskla Ghirardi
 *   Toto        → Toto Mota
 *   BeN / Ben   → Ben Vienne
 *   Ax          → Axel Bourdet
 *   Greg Nappee → Gregory Napy
 */

import { neon } from "@neondatabase/serverless";

const POSTGRES_URL = process.env.POSTGRES_URL;
if (!POSTGRES_URL) { console.error("POSTGRES_URL missing"); process.exit(1); }

const sql = neon(POSTGRES_URL);

// Each entry: [id_or_null, movie_pattern_or_null, fb_publication_autor, new_autor_mix, new_autor_montage]
// If id is provided, use id. Otherwise use movie ILIKE + fb_publication_autor to target the row.
const FIXES = [
  // ── Toto Mota rows: (Montage : Gui) → autor_mix = Toto Mota, autor_montage = Guillaume Agenouiller
  ["2c64c020-62be-44b8-9b14-134f51be1891", null, null,           "Toto Mota",          "Guillaume Agenouiller"],
  [null, "Lilian Thuram%Ace Ventura%",            "Toto Mota",   "Toto Mota",          "Guillaume Agenouiller"],
  [null, "%retreci les gosses%",                  "Toto Mota",   "Toto Mota",          "Guillaume Agenouiller"],
  [null, "%Ocean%Eleven%",                        "Toto Mota",   "Toto Mota",          "Guillaume Agenouiller"],
  [null, "%guerre%toiles%",                       "Toto Mota",   "Toto Mota",          "Guillaume Agenouiller"],

  // ── Toto Mota rows: (Montage : Greg V.) → autor_montage = Grégoire Vienne
  ["9aa22a09-eda9-47d5-bfd2-4b254cea67c4", null, null,           "Toto Mota",          "Grégoire Vienne"],
  ["d51ba78a-6473-4e4c-a030-5f879d74e86d", null, null,           "Toto Mota",          "Grégoire Vienne"],
  [null, "%ETERNAL SUNSHINE%",                    "Toto Mota",   "Toto Mota",          "Grégoire Vienne"],
  [null, "%c%était vrai%",                        "Toto Mota",   "Toto Mota",          "Grégoire Vienne"],
  [null, "%MONA LISA%",                           "Toto Mota",   "Toto Mota",          "Grégoire Vienne"],

  // ── Phil Dodds: (Photomontage: Gui)
  [null, "%Forrest Gump%",                        "Phil Dodds",  "Phil Dodds",         "Guillaume Agenouiller"],

  // ── Phil Dodds: (Photomontage: Toto and Gui)
  [null, "%Rain Man%",                            "Phil Dodds",  "Phil Dodds",         "Toto Mota / Guillaume Agenouiller"],

  // ── Grégoire Vienne: (montage par toto)
  ["8d13bc2c-ea62-4d61-8cec-aa68af84909a", null, null,           "Grégoire Vienne",    "Toto Mota"],

  // ── OSS 117: (Montage: Gui et Toto)
  [null, "%OSS 117%",                             "Toto Mota",   "Toto Mota",          "Guillaume Agenouiller / Toto Mota"],

  // ── Pirates des Caraibes: Mix : SCAL | Montage : TOTO
  [null, "%Pirates%",                             "Toto Mota",   "Paskla Ghirardi",    "Toto Mota"],

  // ── Fanfan la Tulipe: MIX : Greg Nappee | Montage : Toto
  [null, "%Fanfan%",                              "Toto Mota",   "Gregory Napy",       "Toto Mota"],

  // ── Sandrine Ney rows: mix: SCAL | montage: SANDRINE
  [null, "%Amelie Poulain%",                      "Sandrine Ney","Paskla Ghirardi",    "Sandrine Ney"],
  [null, "%diner de Con%",                        "Sandrine Ney","Paskla Ghirardi",    "Sandrine Ney"],
  [null, "%Rasta Rocket%",                        "Sandrine Ney","Paskla Ghirardi",    "Sandrine Ney"],
  [null, "%This is it%",                          "Sandrine Ney","Paskla Ghirardi",    "Sandrine Ney"],

  // ── Guillaume Agenouiller rows: Mix : X | Montage : GUi
  ["da1d7cd2-8aff-4e18-92d6-f9c96781c2fc", null, null,           "Gregory Lenik",      "Guillaume Agenouiller"],
  ["e20b2049-e612-467c-8f52-d52492601fdd", null, null,           "Phil Dodds",         "Guillaume Agenouiller"],
  ["c00ff38e-075c-456c-8155-b94df6e77d2b", null, null,           "Adrien Jeanson",     "Guillaume Agenouiller"],
  ["8eaa294c-64b2-4ede-b1f6-cd315960f8a6", null, null,           "Adrien Jeanson",     "Guillaume Agenouiller"],
  // Mix : Toto | Montage : Toto  (Guillaume posted but Toto did everything)
  ["06fdacfd-8cf6-4d37-bd3c-c7ae02560770", null, null,           "Toto Mota",          "Toto Mota"],
  // Mix : Scal | Montage : Greg & GUi
  ["2201accd-b6b3-4303-b688-8d2c1b89222c", null, null,           "Paskla Ghirardi",    "Grégoire Vienne / Guillaume Agenouiller"],

  // ── Ben Vienne rows: Mix : X | Montage : BeN
  ["a38f275e-ad71-4edd-b949-886ce0730af9", null, null,           "Adrien Jeanson",     "Ben Vienne"],  // Gomorra
  ["cfbcb7f5-9a0a-4d0a-a918-ba41ad0226eb", null, null,           "Pier Levy",          "Ben Vienne"],  // In the mood for love
  ["cf69c06d-9802-49e2-8708-b68bb5675fe4", null, null,           "Paskla Ghirardi",    "Ben Vienne"],  // Serge Gainsbourillon
  ["8fb078f6-7e89-4a36-ac3f-d3767a3a25d9", null, null,           "Paskla Ghirardi",    "Ben Vienne"],  // Les Bronzés

  // ── Ben Vienne: Mix : Bert | Montage : Bert  (Bert = unknown nickname)
  ["cc552a87-988a-4cc7-8e97-192f331d703b", null, null,           "Bert",               "Bert"],

  // ── Ben Vienne: mix : Alain | montage : Bert
  ["9dc89f56-8a80-43ee-89a3-818dc16fa610", null, null,           "Alain",              "Bert"],
  ["6c09a93f-9251-4da0-9ff5-ed64bb08d21c", null, null,           "Alain",              "Bert"],
];

let fixed = 0;
let notFound = 0;

for (const [id, moviePattern, pubAutor, newMix, newMontage] of FIXES) {
  let rows;

  if (id) {
    rows = await sql`
      UPDATE mixes
      SET autor_mix = ${newMix}, autor_montage = ${newMontage}, updated_at = NOW()
      WHERE id = ${id}
      RETURNING id, player, movie, autor_mix, autor_montage
    `;
  } else {
    rows = await sql`
      UPDATE mixes
      SET autor_mix = ${newMix}, autor_montage = ${newMontage}, updated_at = NOW()
      WHERE fb_publication_autor = ${pubAutor}
        AND (movie ILIKE ${moviePattern} OR player ILIKE ${moviePattern})
      RETURNING id, player, movie, autor_mix, autor_montage
    `;
  }

  if (rows.length === 0) {
    console.warn(`⚠  NOT FOUND: id=${id ?? "—"}  movie~="${moviePattern ?? "—"}"`);
    notFound++;
  } else {
    for (const r of rows) {
      const label = [r.player, r.movie].filter(Boolean).join(" × ") || r.id;
      console.log(`✓  ${label}`);
      console.log(`   autor_mix = "${r.autor_mix}"  |  autor_montage = "${r.autor_montage}"`);
    }
    fixed += rows.length;
  }
}

console.log(`\n✓ ${fixed} rows corrected. ${notFound} not found.`);
