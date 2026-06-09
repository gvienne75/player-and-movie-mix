import { neon } from "@neondatabase/serverless";
import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const sql = neon(process.env.POSTGRES_URL!);
  const rows = await sql`SELECT * FROM mixes ORDER BY created_at DESC`;
  return res.json(rows);
}
