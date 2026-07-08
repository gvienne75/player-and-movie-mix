import * as Dialog from "@radix-ui/react-dialog";
import { useState, useRef } from "react";

const XIcon = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" width={14} height={14}>
    <path d="M3 3l10 10M13 3L3 13" />
  </svg>
);

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string).split(",")[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

const fieldStyle: React.CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  background: "rgba(255,255,255,.05)",
  border: "1px solid rgba(255,255,255,.1)",
  borderRadius: 8,
  padding: "10px 14px",
  color: "#f4efe6",
  fontFamily: "var(--font-sans)",
  fontSize: 14,
  outline: "none",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontFamily: "var(--font-mono)",
  fontSize: 10.5,
  letterSpacing: ".14em",
  textTransform: "uppercase",
  color: "#9f988a",
  marginBottom: 6,
};

export function SendMixModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [mixName, setMixName] = useState("");
  const [player, setPlayer] = useState("");
  const [movie, setMovie] = useState("");
  const [senderName, setSenderName] = useState("");
  const [senderEmail, setSenderEmail] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<"idle" | "sending" | "ok" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  function reset() {
    setMixName(""); setPlayer(""); setMovie(""); setSenderName(""); setSenderEmail(""); setFile(null); setStatus("idle");
  }

  function handleClose() {
    reset();
    onClose();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) {
      setErrorMsg("Merci d'ajouter une image de cover.");
      setStatus("error");
      return;
    }
    setStatus("sending");
    try {
      if (file.size > 3 * 1024 * 1024) {
        alert("Image trop lourde (max 3 Mo)");
        setStatus("idle");
        return;
      }
      const cover = { content: await fileToBase64(file), name: file.name, type: file.type };
      const res = await fetch("/api/send-mix", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mixName, player, movie, senderName, senderEmail, cover }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErrorMsg(json.error ?? "Send failed");
        throw new Error();
      }
      setStatus("ok");
    } catch {
      setStatus("error");
    }
  }

  const canSubmit = !!(mixName && player && movie && senderName && senderEmail && file);

  return (
    <Dialog.Root open={open} onOpenChange={(o) => { if (!o) handleClose(); }}>
      <Dialog.Portal>
        <Dialog.Overlay
          style={{
            position: "fixed", inset: 0, zIndex: 200,
            background: "rgba(6,5,3,.82)",
            backdropFilter: "blur(14px)",
          }}
        />
        <Dialog.Content
          aria-describedby={undefined}
          style={{
            position: "fixed", zIndex: 201,
            top: "50%", left: "50%",
            transform: "translate(-50%, -50%)",
            width: "min(460px, calc(100vw - 40px))",
            background: "#1b1812",
            border: "1px solid rgba(255,255,255,.1)",
            borderRadius: 16,
            padding: "28px 24px",
            outline: "none",
          }}
        >
          {/* Header */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 22 }}>
            <Dialog.Title
              style={{
                fontFamily: "var(--font-display)",
                fontSize: 26,
                letterSpacing: ".05em",
                color: "#f4efe6",
                lineHeight: 1,
                margin: 0,
              }}
            >
              SEND A MIX
            </Dialog.Title>
            <Dialog.Close asChild>
              <button
                style={{
                  width: 30, height: 30, borderRadius: "50%",
                  background: "rgba(255,255,255,.07)",
                  border: "1px solid rgba(255,255,255,.08)",
                  color: "#f4efe6", cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <XIcon />
              </button>
            </Dialog.Close>
          </div>

          {status === "ok" ? (
            <div style={{ textAlign: "center", padding: "20px 0 8px" }}>
              <p style={{ fontFamily: "var(--font-display)", fontSize: 24, color: "#e0573f", letterSpacing: ".05em" }}>MIX ENVOYÉ !</p>
              <p style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "#9f988a", marginTop: 8 }}>Merci pour ta contribution.</p>
              <button
                onClick={handleClose}
                style={{
                  marginTop: 20, padding: "8px 22px",
                  background: "rgba(255,255,255,.07)",
                  border: "1px solid rgba(255,255,255,.1)",
                  borderRadius: 8, color: "#f4efe6",
                  fontFamily: "var(--font-mono)", fontSize: 12,
                  cursor: "pointer",
                }}
              >
                Fermer
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={labelStyle}>Mix Name</label>
                <input
                  value={mixName}
                  onChange={(e) => setMixName(e.target.value)}
                  placeholder="Ex: Ace Venthuram"
                  style={fieldStyle}
                  required
                />
              </div>
              <div>
                <label style={labelStyle}>Player</label>
                <input
                  value={player}
                  onChange={(e) => setPlayer(e.target.value)}
                  placeholder="Ex: Lilian Thuram"
                  style={fieldStyle}
                  required
                />
              </div>
              <div>
                <label style={labelStyle}>Movie</label>
                <input
                  value={movie}
                  onChange={(e) => setMovie(e.target.value)}
                  placeholder="Ex: Ace Ventura"
                  style={fieldStyle}
                  required
                />
              </div>
              <div>
                <label style={labelStyle}>Your Name</label>
                <input
                  value={senderName}
                  onChange={(e) => setSenderName(e.target.value)}
                  placeholder="Ex: Jean Dupont"
                  style={fieldStyle}
                  required
                />
              </div>
              <div>
                <label style={labelStyle}>Your Email</label>
                <input
                  type="email"
                  value={senderEmail}
                  onChange={(e) => setSenderEmail(e.target.value)}
                  placeholder="Ex: jean.dupont@email.com"
                  style={fieldStyle}
                  required
                />
              </div>
              <div>
                <label style={labelStyle}>Cover</label>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  style={{ display: "none" }}
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                />
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  style={{
                    ...fieldStyle,
                    cursor: "pointer",
                    textAlign: "left",
                    color: file ? "#f4efe6" : "#9f988a",
                    display: "block",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {file ? file.name : "Choisir une image… (max 3 Mo)"}
                </button>
              </div>

              {status === "error" && (
                <p style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "#e0573f", margin: 0 }}>
                  {errorMsg || "Send failed. Please try again."}
                </p>
              )}

              <button
                type="submit"
                disabled={status === "sending" || !canSubmit}
                style={{
                  marginTop: 6,
                  padding: "11px",
                  background: "#e0573f",
                  border: "none",
                  borderRadius: 8,
                  color: "#15110f",
                  fontFamily: "var(--font-display)",
                  fontSize: 17,
                  letterSpacing: ".06em",
                  cursor: status === "sending" ? "wait" : "pointer",
                  opacity: (status === "sending" || !canSubmit) ? 0.5 : 1,
                  transition: "opacity .15s",
                }}
              >
                {status === "sending" ? "SENDING…" : "SEND"}
              </button>
            </form>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
