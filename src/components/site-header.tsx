import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { X } from "lucide-react";
import { SendMixModal } from "./send-mix-modal";

function FilmStrip() {
  return (
    <div className="flex gap-1 w-full">
      {Array.from({ length: 26 }).map((_, i) => (
        <i key={i} className="film-strip-seg" />
      ))}
    </div>
  );
}

const SearchIcon = () => (
  <svg width="15" height="15" viewBox="0 0 16 16" fill="none" strokeWidth="1.6" strokeLinecap="round" stroke="currentColor">
    <circle cx="7" cy="7" r="4.6" />
    <path d="M10.5 10.5 14 14" />
  </svg>
);

export function SiteHeader() {
  const [searchParams, setSearchParams] = useSearchParams();
  const q = searchParams.get("q") ?? "";
  const [sendOpen, setSendOpen] = useState(() => searchParams.has("propose"));

  function closeSendModal() {
    setSendOpen(false);
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.delete("propose");
        return next;
      },
      { replace: true }
    );
  }

  function handleSearch(value: string) {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (value) next.set("q", value);
        else next.delete("q");
        return next;
      },
      { replace: true }
    );
  }

  return (
    <header
      className="sticky top-0 z-40 flex items-center gap-6 border-b border-border"
      style={{
        padding: "16px clamp(20px,4vw,56px)",
        background: "color-mix(in srgb, #100f0b 82%, transparent)",
        backdropFilter: "blur(16px) saturate(1.2)",
      }}
      role="banner"
    >
      <a
        href="/"
        className="brand-logo inline-flex flex-col items-stretch select-none shrink-0 cursor-pointer"
        onClick={(e) => {
          e.preventDefault();
          window.scrollTo({ top: 0, behavior: "smooth" });
          if (window.location.pathname !== "/") window.location.href = "/";
        }}
        aria-label="Player × Movie Mix — Home"
      >
        <FilmStrip />
        <span
          className="text-center text-[#f4efe6] whitespace-nowrap"
          style={{
            fontFamily: "var(--font-display)",
            fontSize: 40,
            lineHeight: 0.8,
            letterSpacing: ".05em",
            margin: "9px 0 6.5px",
          }}
        >
          PLAYER{" "}
          <b className="text-brand" style={{ fontWeight: 400, padding: "0 2px" }}>
            ×
          </b>{" "}
          MOVIE MIX
        </span>
        <FilmStrip />
      </a>

      <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 10 }}>
        <div className="mix-search">
          <SearchIcon />
          <input
            type="text"
            value={q}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="search a mix, a player…"
            aria-label="Search mixes"
          />
          {q && (
            <button
              onClick={() => handleSearch("")}
              className="text-[#9f988a] hover:text-[#f4efe6] transition-colors"
              aria-label="Clear search"
            >
              <X size={13} />
            </button>
          )}
        </div>

        <button
          onClick={() => setSendOpen(true)}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            padding: "7px 14px",
            background: "#e0573f",
            border: "none",
            borderRadius: 8,
            color: "#15110f",
            fontFamily: "var(--font-display)",
            fontSize: 15,
            letterSpacing: ".06em",
            cursor: "pointer",
            whiteSpace: "nowrap",
            flexShrink: 0,
          }}
        >
          + SEND A MIX
        </button>
      </div>

      <SendMixModal open={sendOpen} onClose={closeSendModal} />
    </header>
  );
}
