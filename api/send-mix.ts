import { Resend } from "resend";
import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

    const body = req.body as {
      mixName?: string;
      player?: string;
      movie?: string;
      senderName?: string;
      senderEmail?: string;
      cover?: { content: string; name: string; type: string };
    } | null;

    console.log("send-mix called, body keys:", body ? Object.keys(body) : "null");

    // Strip BOM (U+FEFF) that PowerShell may have prepended when piping to `vercel env add`
    const apiKey = (process.env.RESEND_API_KEY ?? "").replace(/^\uFEFF/, "").trim();
    if (!apiKey) {
      console.error("RESEND_API_KEY not set");
      return res.status(500).json({ error: "Email not configured (no API key)" });
    }

    const { mixName, player, movie, senderName, senderEmail, cover } = body ?? {};

    if (!mixName || !player || !movie || !senderName || !senderEmail || !cover) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const html = `
      <div style="font-family:sans-serif;max-width:480px">
        <h2 style="color:#e0573f">New Mix Submission</h2>
        <table style="border-collapse:collapse;width:100%">
          <tr><td style="padding:8px 0;color:#888;width:120px">Mix Name</td><td style="padding:8px 0;font-weight:600">${mixName}</td></tr>
          <tr><td style="padding:8px 0;color:#888">Player</td><td style="padding:8px 0;font-weight:600">${player}</td></tr>
          <tr><td style="padding:8px 0;color:#888">Movie</td><td style="padding:8px 0;font-weight:600">${movie}</td></tr>
          <tr><td style="padding:8px 0;color:#888">Sent by</td><td style="padding:8px 0;font-weight:600">${senderName} (${senderEmail})</td></tr>
        </table>
        <p style="color:#888;margin-top:16px">Cover attached: ${cover.name}</p>
      </div>
    `;

    const resend = new Resend(apiKey);

    const { data, error } = await resend.emails.send({
      from: "onboarding@resend.dev",
      to: "gregoire.vienne@gmail.com",
      replyTo: senderEmail,
      subject: `New Mix: ${mixName || player || "Untitled"}`,
      html,
      attachments: [{ filename: cover.name, content: cover.content }],
    });

    if (error) {
      console.error("Resend error:", JSON.stringify(error));
      return res.status(500).json({ error: JSON.stringify(error) });
    }

    console.log("Email sent:", data?.id);
    return res.status(200).json({ ok: true });

  } catch (e) {
    console.error("Unhandled error in send-mix:", e);
    return res.status(500).json({ error: String(e) });
  }
}
