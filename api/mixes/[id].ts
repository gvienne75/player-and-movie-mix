import { neon } from "@neondatabase/serverless";
import type { VercelRequest, VercelResponse } from "@vercel/node";

const ALLOWED_FIELDS = ["player", "movie", "mix_name"] as const;
type AllowedField = (typeof ALLOWED_FIELDS)[number];

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const id = Array.isArray(req.query.id) ? req.query.id[0] : req.query.id;
  if (!id) return res.status(400).json({ error: "Missing id" });

  const sql = neon(process.env.POSTGRES_URL!);

  if (req.method === "GET") {
    const rows = await sql`SELECT * FROM mixes WHERE id = ${id} LIMIT 1`;
    if (!rows[0]) return res.status(404).json({ error: "Not found" });
    return res.json(rows[0]);
  }

  if (req.method === "PATCH") {
    const body: Record<string, unknown> =
      typeof req.body === "string" ? JSON.parse(req.body) : (req.body ?? {});

    const field = (Object.keys(body) as AllowedField[]).find((k) =>
      ALLOWED_FIELDS.includes(k)
    );
    if (!field) return res.status(400).json({ error: "No valid field to update" });

    const value = body[field] ?? null;

    if (field === "player") {
      await sql`UPDATE mixes SET player = ${value as string}, updated_at = NOW() WHERE id = ${id}`;
    } else if (field === "movie") {
      await sql`UPDATE mixes SET movie = ${value as string}, updated_at = NOW() WHERE id = ${id}`;
    } else {
      await sql`UPDATE mixes SET mix_name = ${value as string}, updated_at = NOW() WHERE id = ${id}`;
    }

    return res.json({ success: true });
  }

  return res.status(405).json({ error: "Method not allowed" });
}
