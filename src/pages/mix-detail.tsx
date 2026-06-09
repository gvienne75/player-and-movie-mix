import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getMix, getAdjacentMixes } from "@/lib/mixes";
import type { Mix } from "@/lib/types";

const BASES = ["#1c2422", "#241619", "#141d2a", "#1e1f12", "#201425", "#231a11", "#12211b", "#251318"];

function getBase(id: string): string {
  const hash = id.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  return BASES[hash % BASES.length];
}

const CloseIcon = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" width={16} height={16}>
    <path d="M3 3l10 10M13 3L3 13" />
  </svg>
);

const ArrowIcon = ({ dir }: { dir: "prev" | "next" }) => (
  <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width={18} height={18}>
    {dir === "prev" ? <path d="M11 3L5 9l6 6" /> : <path d="M7 3l6 6-6 6" />}
  </svg>
);

const ExternalIcon = () => (
  <svg width={12} height={12} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M7 3H3a1 1 0 0 0-1 1v9a1 1 0 0 0 1 1h9a1 1 0 0 0 1-1V9" />
    <path d="M13 3h-4m4 0v4m0-4L8 8" />
  </svg>
);

export default function MixDetailPage({ modal = false }: { modal?: boolean }) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [mix, setMix] = useState<Mix | null>(null);
  const [prev, setPrev] = useState<Mix | null>(null);
  const [next, setNext] = useState<Mix | null>(null);
  const [loadedId, setLoadedId] = useState<string | null>(null);

  const loading = loadedId !== id;

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    getMix(id).then(async (m) => {
      if (cancelled) return;
      setMix(m);
      setPrev(null);
      setNext(null);
      if (m) {
        const adj = await getAdjacentMixes(m);
        if (cancelled) return;
        setPrev(adj.prev);
        setNext(adj.next);
      }
      setLoadedId(id);
    });
    return () => { cancelled = true; };
  }, [id]);

  const close = useCallback(() => navigate("/"), [navigate]);

  const goNext = useCallback(() => {
    if (next) navigate(`/mix/${next.id}`, { state: modal ? { backgroundLocation: { pathname: "/" } } : undefined });
  }, [next, navigate, modal]);

  const goPrev = useCallback(() => {
    if (prev) navigate(`/mix/${prev.id}`, { state: modal ? { backgroundLocation: { pathname: "/" } } : undefined });
  }, [prev, navigate, modal]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "ArrowRight") goNext();
      else if (e.key === "ArrowLeft") goPrev();
      else if (e.key === "Escape") close();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [goNext, goPrev, close]);

  useEffect(() => {
    if (!modal) return;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, [modal]);

  const base = mix ? getBase(mix.id) : BASES[0];
  const tintBg = `linear-gradient(155deg, color-mix(in srgb, ${base} 70%, #fff 14%), ${base} 62%, #0b0a07)`;
  const thumbnail = mix ? (mix.image ?? mix.fb_image) : null;
  const title = mix?.mix_name ?? [mix?.player, mix?.movie].filter(Boolean).join(" × ") ?? "";

  const inner = (
    <div
      className="lb-inner-anim relative z-10 flex items-center w-full"
      style={{ maxWidth: 940, gap: "clamp(26px,4.5vw,58px)" }}
      key={id}
    >
      {/* Poster card */}
      <div
        className="relative flex-shrink-0 overflow-hidden isolate"
        style={{
          width: "clamp(230px,32vw,360px)",
          aspectRatio: "2/3",
          borderRadius: 16,
          boxShadow: "0 40px 90px rgba(0,0,0,.62), 0 8px 24px rgba(0,0,0,.5)",
          background: tintBg,
        }}
      >
        {thumbnail ? (
          <img
            src={thumbnail}
            alt={title}
            className="absolute inset-0 w-full h-full object-contain"
          />
        ) : (
          <div
            className="absolute inset-0 flex items-center justify-center"
            style={{ fontFamily: "var(--font-display)", fontSize: 168, color: "rgba(255,255,255,.07)", lineHeight: 1 }}
          >
            {mix ? "?" : ""}
          </div>
        )}
        <div className="mix-sheen" />
        <div className="mix-grain" />
        <div className="mix-holo" style={{ opacity: 0.15 }} />
        {!thumbnail && (
          <span
            className="absolute left-[14px] bottom-[13px] z-[7]"
            style={{ fontFamily: "var(--font-mono)", fontSize: 9.5, letterSpacing: ".12em", textTransform: "uppercase", color: "rgba(255,255,255,.38)" }}
          >
            drop the poster
          </span>
        )}
      </div>

      {/* Info panel */}
      {loading ? (
        <div className="flex-1" style={{ maxWidth: 540 }}>
          <div style={{ height: 62, background: "rgba(255,255,255,.04)", borderRadius: 4, marginBottom: 16 }} />
          <div style={{ height: 200, background: "rgba(255,255,255,.04)", borderRadius: 4 }} />
        </div>
      ) : mix ? (
        <div className="flex-1 min-w-0" style={{ maxWidth: 540 }}>
          <h1
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(40px,4.8vw,62px)",
              lineHeight: 0.82,
              letterSpacing: ".012em",
              color: "#fff",
              margin: "0 0 4px",
              textWrap: "balance",
              overflowWrap: "break-word",
              textShadow: "0 4px 30px rgba(0,0,0,.5)",
            }}
          >
            {title}
          </h1>

          <div
            className="grid"
            style={{
              gridTemplateColumns: "auto 1fr",
              gap: "9px 18px",
              marginTop: 26,
              borderTop: "1px solid rgba(255,255,255,.08)",
              paddingTop: 22,
            }}
          >
            {mix.fb_publication_date && (
              <>
                <MetaKey>Date</MetaKey>
                <MetaVal mono>
                  {new Date(mix.fb_publication_date).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
                </MetaVal>
              </>
            )}
            {mix.player && (
              <>
                <MetaKey>Player</MetaKey>
                <MetaVal>{mix.player}</MetaVal>
              </>
            )}
            {mix.movie && (
              <>
                <MetaKey>Movie</MetaKey>
                <MetaVal>
                  {mix.movie}
                  {mix.movie_year ? ` (${mix.movie_year})` : ""}
                </MetaVal>
              </>
            )}
            {mix.autor_mix && (
              <>
                <MetaKey>Mix Author</MetaKey>
                <MetaVal>{mix.autor_mix}</MetaVal>
              </>
            )}
            {mix.autor_montage && mix.autor_montage !== mix.autor_mix && (
              <>
                <MetaKey>Montage Author</MetaKey>
                <MetaVal>{mix.autor_montage}</MetaVal>
              </>
            )}
            {mix.fb_description && (
              <>
                <MetaKey>Comment</MetaKey>
                <MetaVal dim>{mix.fb_description}</MetaVal>
              </>
            )}
            {mix.fb_url && (
              <>
                <MetaKey>Source</MetaKey>
                <MetaVal>
                  <a
                    href={mix.fb_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 hover:text-brand transition-colors"
                  >
                    Open link <ExternalIcon />
                  </a>
                </MetaVal>
              </>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );

  const chrome = (
    <>
      {/* Close button */}
      <button
        onClick={close}
        aria-label="Close"
        className="fixed z-[4] flex items-center justify-center transition-all duration-[160ms] group"
        style={{
          top: "clamp(16px,3vw,28px)",
          right: "clamp(16px,3vw,28px)",
          width: 42,
          height: 42,
          borderRadius: "50%",
          background: "rgba(255,255,255,.07)",
          border: "1px solid rgba(255,255,255,.08)",
          color: "#f4efe6",
          cursor: "pointer",
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLButtonElement).style.background = "#e0573f";
          (e.currentTarget as HTMLButtonElement).style.borderColor = "#e0573f";
          (e.currentTarget as HTMLButtonElement).style.color = "#15110f";
          (e.currentTarget as HTMLButtonElement).style.transform = "rotate(90deg)";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,.07)";
          (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,255,255,.08)";
          (e.currentTarget as HTMLButtonElement).style.color = "#f4efe6";
          (e.currentTarget as HTMLButtonElement).style.transform = "";
        }}
      >
        <CloseIcon />
      </button>

      {/* Prev */}
      {prev && (
        <button
          onClick={goPrev}
          aria-label="Previous mix"
          className="fixed z-[4] flex items-center justify-center transition-all duration-[160ms]"
          style={{
            left: "clamp(10px,2vw,24px)",
            top: "50%",
            transform: "translateY(-50%)",
            width: 48, height: 48,
            borderRadius: "50%",
            background: "rgba(255,255,255,.06)",
            border: "1px solid rgba(255,255,255,.08)",
            color: "#f4efe6",
            cursor: "pointer",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,.14)";
            (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,255,255,.3)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,.06)";
            (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,255,255,.08)";
          }}
        >
          <ArrowIcon dir="prev" />
        </button>
      )}

      {/* Next */}
      {next && (
        <button
          onClick={goNext}
          aria-label="Next mix"
          className="fixed z-[4] flex items-center justify-center transition-all duration-[160ms]"
          style={{
            right: "clamp(10px,2vw,24px)",
            top: "50%",
            transform: "translateY(-50%)",
            width: 48, height: 48,
            borderRadius: "50%",
            background: "rgba(255,255,255,.06)",
            border: "1px solid rgba(255,255,255,.08)",
            color: "#f4efe6",
            cursor: "pointer",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,.14)";
            (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,255,255,.3)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,.06)";
            (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,255,255,.08)";
          }}
        >
          <ArrowIcon dir="next" />
        </button>
      )}
    </>
  );

  if (modal) {
    return (
      <div
        className="fixed inset-0 z-[100] flex items-center justify-center"
        style={{ padding: "clamp(16px,4vw,56px)" }}
        role="dialog"
        aria-modal="true"
      >
        <div
          className="lb-backdrop-anim absolute inset-0"
          style={{ background: "rgba(6,5,3,.8)", backdropFilter: "blur(12px) saturate(1.1)" }}
          onClick={close}
        />
        {chrome}
        {inner}
      </div>
    );
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ padding: "clamp(16px,4vw,56px)", background: "#100f0b" }}
    >
      {chrome}
      {inner}
    </div>
  );
}

// ─── Helpers ───────────────────────────────────────────────────────────────────────────────

function MetaKey({ children }: { children: React.ReactNode }) {
  return (
    <span
      style={{
        fontFamily: "var(--font-mono)",
        fontSize: 10.5,
        letterSpacing: ".14em",
        textTransform: "uppercase",
        color: "#9f988a",
        alignSelf: "start",
        paddingTop: 2,
      }}
    >
      {children}
    </span>
  );
}

function MetaVal({ children, mono, dim }: { children: React.ReactNode; mono?: boolean; dim?: boolean }) {
  return (
    <span
      style={{
        fontFamily: dim || mono ? "var(--font-mono)" : "var(--font-sans)",
        fontSize: dim ? 13.5 : mono ? 14 : 15,
        fontWeight: dim ? 500 : 600,
        color: dim ? "#9f988a" : "#f4efe6",
        lineHeight: dim ? 1.45 : undefined,
      }}
    >
      {children}
    </span>
  );
}
