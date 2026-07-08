import { useEffect, useState, useCallback, useMemo } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
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


function fmtDate(d: string | null) {
  if (!d) return null;
  try {
    return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
  } catch {
    return d;
  }
}


export default function MixDetailPage({ modal = false }: { modal?: boolean }) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  // Filter-aware navigation: read filteredIds + backgroundLocation passed via router state
  const routeState = location.state as { filteredIds?: string[]; backgroundLocation?: { pathname: string; search?: string; hash?: string } } | null;
  const filteredIds: string[] | null = routeState?.filteredIds ?? null;
  const backgroundLocation = routeState?.backgroundLocation ?? null;
  const currentIndex = filteredIds && id ? filteredIds.indexOf(id) : -1;
  const prevId = filteredIds && currentIndex > 0 ? filteredIds[currentIndex - 1] : null;
  const nextId = filteredIds && currentIndex !== -1 && currentIndex < filteredIds.length - 1 ? filteredIds[currentIndex + 1] : null;
  const shouldFetchAdjacent = !filteredIds;

  const [mix, setMix] = useState<Mix | null>(null);
  const [apiPrev, setApiPrev] = useState<Mix | null>(null);
  const [apiNext, setApiNext] = useState<Mix | null>(null);
  const [loadedId, setLoadedId] = useState<string | null>(null);

  const loading = loadedId !== id;

  const base = id ? getBase(id) : BASES[0];
  const tintBg = `linear-gradient(155deg, color-mix(in srgb, ${base} 70%, #fff 14%), ${base} 62%, #0b0a07)`;

  useEffect(() => {
    if (!id) return;
    let cancelled = false;

    async function load() {
      const m = await getMix(id!);
      if (cancelled) return;
      setMix(m);
      setApiPrev(null);
      setApiNext(null);
      if (m && shouldFetchAdjacent) {
        const adj = await getAdjacentMixes(m);
        if (cancelled) return;
        setApiPrev(adj.prev);
        setApiNext(adj.next);
      }
      setLoadedId(id!);
    }

    load();
    return () => { cancelled = true; };
  }, [id, shouldFetchAdjacent]);

  const backLoc = useMemo(
    () => backgroundLocation ?? { pathname: "/" },
    // backgroundLocation comes from router state and only changes when we navigate
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [backgroundLocation?.pathname, (backgroundLocation as { search?: string } | null)?.search]
  );
  const navState = useMemo(
    () => modal ? { backgroundLocation: backLoc, filteredIds } : { filteredIds },
    [modal, filteredIds, backLoc]
  );

  const close = useCallback(() => {
    const search = (backLoc as { search?: string }).search ?? "";
    navigate(backLoc.pathname + search);
  }, [navigate, backLoc]);

  const goNext = useCallback(() => {
    const targetId = nextId ?? apiNext?.id;
    if (targetId) navigate(`/mix/${targetId}`, { state: navState });
  }, [nextId, apiNext, navigate, navState]);

  const goPrev = useCallback(() => {
    const targetId = prevId ?? apiPrev?.id;
    if (targetId) navigate(`/mix/${targetId}`, { state: navState });
  }, [prevId, apiPrev, navigate, navState]);

  const hasPrev = !!(prevId ?? apiPrev);
  const hasNext = !!(nextId ?? apiNext);

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

  const thumbnail = mix ? (mix.image ?? mix.fb_image) : null;
  const mixName = mix?.mix_name;
  const playerMovie = [mix?.player, mix?.movie].filter(Boolean).join(" × ");
  const title = mixName ?? playerMovie ?? "";

  // Fallback: if autor_mix, autor_montage AND fb_description are all empty, use fb_publication_autor for both
  const allEmpty = mix && !mix.autor_mix && !mix.autor_montage && !mix.fb_description;
  const displayAutorMix = mix?.autor_mix ?? (allEmpty ? (mix?.fb_publication_autor ?? null) : null);
  const displayAutorMontage = mix?.autor_montage ?? (allEmpty ? (mix?.fb_publication_autor ?? null) : null);

  const inner = (
    <div
      className="lb-inner-anim relative z-10 flex items-start w-full"
      style={{ maxWidth: 1080, gap: "clamp(24px,4vw,56px)" }}
      key={id}
    >
      {/* Poster */}
      <div
        className="relative flex-shrink-0 overflow-hidden isolate"
        style={{
          width: "clamp(280px,38vw,440px)",
          aspectRatio: "2/3",
          borderRadius: 16,
          boxShadow: "0 40px 90px rgba(0,0,0,.65), 0 8px 24px rgba(0,0,0,.5)",
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
        <div className="flex-1 pt-2" style={{ maxWidth: 540 }}>
          <div style={{ height: 62, background: "rgba(255,255,255,.04)", borderRadius: 4, marginBottom: 16 }} />
          <div style={{ height: 200, background: "rgba(255,255,255,.04)", borderRadius: 4 }} />
        </div>
      ) : mix ? (
        <div className="flex-1 min-w-0 pt-2" style={{ maxWidth: 540 }}>
          <h1
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(38px,4.6vw,60px)",
              lineHeight: 0.84,
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

          {/* Subtitle: date · Mix: xx · Montage: yy */}
          {(mix.fb_publication_date || displayAutorMix || displayAutorMontage) && (
            <p style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "#9f988a", margin: "10px 0 0", letterSpacing: ".03em", lineHeight: 1.6 }}>
              {[
                mix.fb_publication_date
                  ? <span key="date"><b style={{ color: "#f4efe6", fontWeight: 700 }}>{fmtDate(mix.fb_publication_date)}</b></span>
                  : null,
                displayAutorMix
                  ? <span key="mix">Mix : <b style={{ color: "#f4efe6", fontWeight: 700 }}>{displayAutorMix}</b></span>
                  : null,
                displayAutorMontage
                  ? <span key="mont">Montage : <b style={{ color: "#f4efe6", fontWeight: 700 }}>{displayAutorMontage}</b></span>
                  : null,
              ]
                .filter(Boolean)
                .flatMap((el, i) => i === 0 ? [el] : [<span key={`sep-${i}`} style={{ margin: "0 5px" }}>·</span>, el])}
            </p>
          )}

          <div
            className="grid"
            style={{
              gridTemplateColumns: "auto 1fr",
              gap: "9px 18px",
              marginTop: 22,
              borderTop: "1px solid rgba(255,255,255,.08)",
              paddingTop: 20,
            }}
          >
            <MetaKey>Player</MetaKey>
            <MetaVal dim={!mix.player}>{mix.player ?? "—"}</MetaVal>

            <MetaKey>Movie</MetaKey>
            <MetaVal dim={!mix.movie}>
              {mix.movie ? (
                <>
                  {mix.movie}
                  {mix.movie_year && <span style={{ color: "#9f988a", fontWeight: 400, fontSize: 13 }}> ({mix.movie_year})</span>}
                </>
              ) : "—"}
            </MetaVal>
          </div>
        </div>
      ) : null}
    </div>
  );

  const chrome = (
    <>
      {/* Close */}
      <button
        onClick={close}
        aria-label="Close"
        className="fixed z-[120] flex items-center justify-center"
        style={{
          top: "clamp(16px,3vw,28px)",
          right: "clamp(16px,3vw,28px)",
          width: 42, height: 42,
          borderRadius: "50%",
          background: "rgba(255,255,255,.07)",
          border: "1px solid rgba(255,255,255,.08)",
          color: "#f4efe6",
          cursor: "pointer",
          transition: "background .16s, border-color .16s, color .16s, transform .16s",
        }}
        onMouseEnter={(e) => {
          const btn = e.currentTarget as HTMLButtonElement;
          btn.style.background = "#e0573f";
          btn.style.borderColor = "#e0573f";
          btn.style.color = "#15110f";
          btn.style.transform = "rotate(90deg)";
        }}
        onMouseLeave={(e) => {
          const btn = e.currentTarget as HTMLButtonElement;
          btn.style.background = "rgba(255,255,255,.07)";
          btn.style.borderColor = "rgba(255,255,255,.08)";
          btn.style.color = "#f4efe6";
          btn.style.transform = "";
        }}
      >
        <CloseIcon />
      </button>

      {/* Prev arrow */}
      {hasPrev && (
        <button
          onClick={goPrev}
          aria-label="Previous mix"
          className="fixed z-[120] flex items-center justify-center"
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
            transition: "background .16s, border-color .16s",
          }}
          onMouseEnter={(e) => {
            const btn = e.currentTarget as HTMLButtonElement;
            btn.style.background = "rgba(255,255,255,.14)";
            btn.style.borderColor = "rgba(255,255,255,.3)";
          }}
          onMouseLeave={(e) => {
            const btn = e.currentTarget as HTMLButtonElement;
            btn.style.background = "rgba(255,255,255,.06)";
            btn.style.borderColor = "rgba(255,255,255,.08)";
          }}
        >
          <ArrowIcon dir="prev" />
        </button>
      )}

      {/* Next arrow */}
      {hasNext && (
        <button
          onClick={goNext}
          aria-label="Next mix"
          className="fixed z-[120] flex items-center justify-center"
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
            transition: "background .16s, border-color .16s",
          }}
          onMouseEnter={(e) => {
            const btn = e.currentTarget as HTMLButtonElement;
            btn.style.background = "rgba(255,255,255,.14)";
            btn.style.borderColor = "rgba(255,255,255,.3)";
          }}
          onMouseLeave={(e) => {
            const btn = e.currentTarget as HTMLButtonElement;
            btn.style.background = "rgba(255,255,255,.06)";
            btn.style.borderColor = "rgba(255,255,255,.08)";
          }}
        >
          <ArrowIcon dir="next" />
        </button>
      )}

      {/* Counter — bottom center */}
      {filteredIds && currentIndex !== -1 && (
        <div
          className="fixed z-[120]"
          style={{
            bottom: "clamp(16px,3vw,28px)",
            left: "50%",
            transform: "translateX(-50%)",
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            padding: "7px 18px",
            borderRadius: 999,
            background: "rgba(20,17,12,.75)",
            border: "1px solid rgba(255,255,255,.1)",
            backdropFilter: "blur(12px)",
            fontFamily: "var(--font-mono)",
            fontSize: 12,
            letterSpacing: ".08em",
            color: "#f4efe6",
          }}
        >
          <span style={{ color: "#e0573f", fontWeight: 600 }}>{currentIndex + 1}</span>
          <span style={{ color: "#9f988a" }}>/</span>
          <span>{filteredIds.length}</span>
        </div>
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
          style={{ background: "rgba(6,5,3,.82)", backdropFilter: "blur(14px) saturate(1.1)" }}
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

// ─── Helpers ────────────────────────────────────────────────────────────────

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
        whiteSpace: "nowrap",
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
        fontSize: dim ? 12 : mono ? 13.5 : 15,
        fontWeight: dim ? 400 : 600,
        color: dim ? "#9f988a" : "#f4efe6",
        lineHeight: dim ? 1.5 : undefined,
        wordBreak: "break-all",
      }}
    >
      {children}
    </span>
  );
}
