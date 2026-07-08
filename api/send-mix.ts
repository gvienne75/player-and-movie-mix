import { Resend } from "resend";
import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { mixName, player, movie, cover } = req.body as {
    mixName?: string;
    player?: string;
    movie?: string;
    cover?: { content: string; name: string; type: string };
  };

  if (!process.env.RESEND_API_KEY) {
    return res.status(500).json({ error: "Email not configured" });
  }

  const resend = new Resend(process.env.RESEND_API_KEY);

  const html = `
    <div style="font-family:sans-serif;max-width:480px">
      <h2 style="color:#e0573f;margin-bottom:20px">New Mix Submission</h2>
      <table style="border-collapse:collapse;width:100%">
        <tr><td style="padding:8px 0;color:#888;width:120px">Mix Name</td><td style="padding:8px 0;font-weight:600">${mixName || "—"}</td></tr>
        <tr><td style="padding:8px 0;color:#888">Player</td><td style="padding:8px 0;font-weight:600">${player || "—"}</td></tr>
        <tr><td style="padding:8px 0;color:#888">Movie</td><td style="padding:8px 0;font-weight:600">${movie || "—"}</td></tr>
      </table>
      ${cover ? `<p style="color:#888;margin-top:16px">Cover attached: ${cover.name}</p>` : ""}
    </div>
  `;

  const { error } = await resend.emails.send({
    from: "Player × Movie Mix <onboarding@resend.dev>",
    to: ["gregoire.vienne@gmail.com"],
    subject: `New Mix: ${mixName || player || "Untitled"}`,
    html,
    attachments: cover
      ? [{ filename: cover.name, content: cover.content }]
      : [],
  });

  if (error) {
    console.error("Resend error:", error);
    return res.status(500).json({ error: "Send failed" });
  }

  return res.status(200).json({ ok: true });
}
