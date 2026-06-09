import { neon } from "@neondatabase/serverless";
import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const id = Array.isArray(req.query.id) ? req.query.id[0] : req.query.id;
  if (!id) return res.status(400).json({ error: "Missing id" });

  const sql = neon(process.env.POSTGRES_URL!);

  const current = await sql`SELECT created_at FROM mixes WHERE id = ${id} LIMIT 1`;
  if (!current[0]) return res.status(404).json({ error: "Not found" });

  const createdAt = current[0].created_at as string;

  const [prevRows, nextRows] = await Promise.all([
    sql`SELECT * FROM mixes WHERE created_at < ${createdAt} ORDER BY created_at DESC LIMIT 1`,
    sql`SELECT * FROM mixes WHERE created_at > ${createdAt} ORDER BY created_at ASC LIMIT 1`,
  ]);

  return res.json({ prev: prevRows[0] ?? null, next: nextRows[0] ?? null });
}
