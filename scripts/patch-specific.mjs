import { neon } from "@neondatabase/serverless";

const POSTGRES_URL = process.env.POSTGRES_URL;
if (!POSTGRES_URL) { console.error("POSTGRES_URL missing"); process.exit(1); }

const sql = neon(POSTGRES_URL);

// 1. Croc Blanc — autor_mix = Toto Mota
const r1 = await sql`
  UPDATE mixes SET autor_mix = 'Toto Mota', updated_at = NOW()
  WHERE movie ILIKE 'Croc Blanc'
  RETURNING id, movie, autor_mix, autor_montage
`;
console.log("Croc Blanc:", r1);

// 2. Terminator — autor_mix = Sandrine Ney
const r2 = await sql`
  UPDATE mixes SET autor_mix = 'Sandrine Ney', updated_at = NOW()
  WHERE movie ILIKE 'Terminator'
  RETURNING id, movie, autor_mix, autor_montage
`;
console.log("Terminator:", r2);

// 3. Les 3 mixes de Constance Nv — autor_montage = Guillaume Agenouiller
const ids = [
  'ec116d57-b1e6-43e5-8566-445cc7751319',
  '3ebdeb84-5466-47f9-a246-9b0a0a48c982',
  '5d678f58-b6fe-4f7f-9de8-49a09268d13e',
];
const r3 = await sql`
  UPDATE mixes SET autor_montage = 'Guillaume Agenouiller', updated_at = NOW()
  WHERE id = ANY(${ids})
  RETURNING id, movie, autor_mix, autor_montage
`;
console.log("Constance Nv (3 mixes):", r3);
