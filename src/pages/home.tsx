import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import { getMixes } from "@/lib/mixes";
import type { Mix } from "@/lib/types";

const INITIAL_COUNT = 60;
const LOAD_MORE_COUNT = 60;
const BASES = ["#1c2422", "#241619", "#141d2a", "#1e1f12", "#201425", "#231a11", "#12211b", "#251318"];

const FACETS = [
  { id: "p",    label: "Players",        field: "player"         as keyof Mix },
  { id: "m",    label: "Movies",         field: "movie"          as keyof Mix },
  { id: "mix",  label: "Mix Author",     field: "autor_mix"      as keyof Mix },
  { id: "mont", label: "Montage Author", field: "autor_montage"  as keyof Mix },
] as const;

const SORTS = [
  { key: "ds" as const, label: "Mix Date"   },
  { key: "my" as const, label: "Movie Year" },
  { key: "m"  as const, label: "Movie Name" },
];

type SortKey = "ds" | "my" | "m";
type SortDir = "asc" | "desc";
type SelState = Record<string, Set<string>>;

const ChevIcon = ({ open }: { open: boolean }) => (
  <svg
    className="mix-chev"
    style={{ width: 9, height: 9, flexShrink: 0 }}
    viewBox="0 0 10 10" fill="none" strokeWidth="1.7" strokeLinecap="round"
    stroke="currentColor"
    aria-hidden
  >
    <path d={open ? "M2 6l3-3 3 3" : "M2 4l3 3 3-3"} />
  </svg>
);

const CheckIcon = () => (
  <svg width="10" height="10" viewBox="0 0 10 10" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" stroke="currentColor">
    <path d="M2 5.2l2 2L8 3" />
  </svg>
);

const SortIconSvg = () => (
  <svg style={{ width: 13, height: 13, opacity: .85 }} viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3.5 9.5V2.8M1.6 4.8 3.5 2.8 5.4 4.8" />
    <path d="M8.5 2.5v6.7M6.6 7.2 8.5 9.2 10.4 7.2" />
  </svg>
);

const ArrowUp = () => (
  <svg style={{ width: 11, height: 11 }} viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 9.4V2.6M3 5.6 6 2.6 9 5.6" />
  </svg>
);

const ArrowDown = () => (
  <svg style={{ width: 11, height: 11 }} viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 2.6v6.8M3 6.4 6 9.4 9 6.4" />
  </svg>
);

// ─── Facet dropdown ───────────────────────────────────────────────────────────

function Facet({
  f, opts, optCounts, sel, open, onOpen, onToggle, labelFor,
}: {
  f: typeof FACETS[number];
  opts: string[];
  optCounts: Record<string, number>;
  sel: Set<string>;
  open: boolean;
  onOpen: () => void;
  onToggle: (fid: string, val: string) => void;
  labelFor?: (val: string) => string;
}) {
  return (
    <div className="relative" data-facet>
      <button
        className={`mix-facet${sel.size ? " active" : ""}${open ? " open" : ""}`}
        onClick={onOpen}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        {f.label}
        {sel.size > 0 ? (
          <span style={{
            minWidth: 17, height: 17, padding: "0 4px", borderRadius: 9,
            background: "#e0573f", color: "#15110f",
            fontSize: 10, fontWeight: 600,
            display: "inline-flex", alignItems: "center", justifyContent: "center",
          }}>
            {sel.size}
          </span>
        ) : (
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "#9f988a" }}>
            {opts.length}
          </span>
        )}
        <ChevIcon open={open} />
      </button>
      {open && (
        <div className="mix-pop" role="listbox" aria-multiselectable="true">
          {opts.map((o) => (
            <button
              key={o}
              className="mix-pop-opt"
              role="option"
              aria-selected={sel.has(o)}
              onClick={() => onToggle(f.id, o)}
            >
              <span className={`mix-checkbox${sel.has(o) ? " checked" : ""}`}>
                {sel.has(o) && <CheckIcon />}
              </span>
              <span className="flex-1 text-left">{labelFor ? labelFor(o) : o}</span>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 10.5, color: "#9f988a" }}>
                {optCounts[o] ?? 0}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Sort menu ────────────────────────────────────────────────────────────────

function SortMenu({
  sort, setSort, open, onOpen,
}: {
  sort: { key: SortKey; dir: SortDir };
  setSort: (s: { key: SortKey; dir: SortDir }) => void;
  open: boolean;
  onOpen: () => void;
}) {
  const cur = SORTS.find((s) => s.key === sort.key)!;
  return (
    <div className="relative" data-facet>
      <button className={`mix-facet${open ? " open" : ""}`} onClick={onOpen}>
        <SortIconSvg />
        {cur.label}
        {sort.dir === "asc" ? <ArrowUp /> : <ArrowDown />}
        <ChevIcon open={open} />
      </button>
      {open && (
        <div className="mix-sort-pop" style={{ left: "auto", right: 0 }}>
          {SORTS.map((s) => (
            <div className="mix-sort-grp" key={s.key}>
              <span className="flex-1" style={{ fontFamily: "var(--font-sans)", fontSize: 13, color: "#f4efe6" }}>
                {s.label}
              </span>
              <div className="flex gap-1">
                <button
                  className={`mix-sort-btn${sort.key === s.key && sort.dir === "asc" ? " on" : ""}`}
                  onClick={() => setSort({ key: s.key, dir: "asc" })}
                  aria-label="ascending"
                >
                  <ArrowUp />
                </button>
                <button
                  className={`mix-sort-btn${sort.key === s.key && sort.dir === "desc" ? " on" : ""}`}
                  onClick={() => setSort({ key: s.key, dir: "desc" })}
                  aria-label="descending"
                >
                  <ArrowDown />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── HomePage ─────────────────────────────────────────────────────────────────

export default function HomePage() {
  const [allMixes, setAllMixes] = useState<Mix[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const searchQuery = searchParams.get("q") ?? "";

  const [sel, setSel] = useState<SelState>({
    p: new Set(), m: new Set(), mix: new Set(), mont: new Set(),
  });
  const [openFacet, setOpenFacet] = useState<string | null>(null);
  const [sortOpen, setSortOpen] = useState(false);
  const [sort, setSort] = useState<{ key: SortKey; dir: SortDir }>({ key: "ds", dir: "desc" });
  const [visibleCount, setVisibleCount] = useState(INITIAL_COUNT);
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getMixes()
      .then(setAllMixes)
      .catch(() => setError("Could not load mixes."))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    function handlePointerDown(e: PointerEvent) {
      if (!(e.target as Element).closest("[data-facet]")) {
        setOpenFacet(null);
        setSortOpen(false);
      }
    }
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, []);

  const { opts, optCounts, movieYears } = useMemo(() => {
    const counts: Record<string, Record<string, number>> = { p: {}, m: {}, mix: {}, mont: {} };
    const years: Record<string, number> = {};
    for (const mix of allMixes) {
      for (const { id, field } of FACETS) {
        const v = mix[field] as string | null;
        if (v) counts[id][v] = (counts[id][v] ?? 0) + 1;
      }
      if (mix.movie && mix.movie_year) years[mix.movie] = mix.movie_year;
    }
    const sorted: Record<string, string[]> = {};
    for (const { id } of FACETS) {
      sorted[id] = Object.keys(counts[id]).sort((a, b) => (counts[id][b] - counts[id][a]) || a.localeCompare(b));
    }
    return { opts: sorted, optCounts: counts, movieYears: years };
  }, [allMixes]);

  const filteredMixes = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    let result = allMixes.filter((mix) => {
      if (sel.p.size    > 0 && !sel.p.has(mix.player ?? ""))         return false;
      if (sel.m.size    > 0 && !sel.m.has(mix.movie ?? ""))          return false;
      if (sel.mix.size  > 0 && !sel.mix.has(mix.autor_mix ?? ""))    return false;
      if (sel.mont.size > 0 && !sel.mont.has(mix.autor_montage ?? "")) return false;
      if (q) {
        const hay = [mix.player, mix.movie, mix.autor_mix, mix.autor_montage]
          .filter(Boolean).join(" ").toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });

    result = [...result].sort((a, b) => {
      let cmp: number;
      if (sort.key === "my") {
        cmp = (a.movie_year ?? 0) - (b.movie_year ?? 0);
      } else if (sort.key === "m") {
        cmp = (a.movie ?? "").localeCompare(b.movie ?? "");
      } else {
        cmp = (a.fb_publication_date ?? "").localeCompare(b.fb_publication_date ?? "");
      }
      return sort.dir === "asc" ? cmp : -cmp;
    });

    return result;
  }, [allMixes, sel, searchQuery, sort]);

  const filteredIds = useMemo(() => filteredMixes.map((m) => m.id), [filteredMixes]);

  // Permanent rank: oldest fb_publication_date = #001, most recent = #215
  const rankMap = useMemo(() => {
    const sorted = [...allMixes].sort((a, b) =>
      (a.fb_publication_date ?? "").localeCompare(b.fb_publication_date ?? "")
    );
    return new Map(sorted.map((m, i) => [m.id, i + 1]));
  }, [allMixes]);
  const visibleMixes = filteredMixes.slice(0, visibleCount);
  const hasMore = visibleCount < filteredMixes.length;
  const anyActive = FACETS.some((f) => sel[f.id].size > 0) || !!searchQuery.trim();

  useEffect(() => {
    if (!hasMore) return;
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) setVisibleCount((c) => c + LOAD_MORE_COUNT);
      },
      { rootMargin: "300px" }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, visibleMixes.length]);

  function toggle(fid: string, val: string) {
    setSel((s) => {
      const next = new Set(s[fid]);
      if (next.has(val)) { next.delete(val); } else { next.add(val); }
      return { ...s, [fid]: next };
    });
    setVisibleCount(INITIAL_COUNT);
  }

  function clearAll() {
    setSel({ p: new Set(), m: new Set(), mix: new Set(), mont: new Set() });
    setSearchParams({}, { replace: true });
    setVisibleCount(INITIAL_COUNT);
  }

  const chips = FACETS.flatMap((f) =>
    [...sel[f.id]].map((v) => ({ fid: f.id, label: f.label, v }))
  );

  return (
    <div className="min-h-dvh">
      {/* Filter bar — count left | facets center | sort right */}
      <div
        className="flex items-center"
        style={{ gap: 12, padding: "clamp(20px,3vw,32px) clamp(20px,4vw,56px) 6px" }}
      >
        {/* Count */}
        <span className="shrink-0" style={{ fontFamily: "var(--font-mono)", fontSize: 14, color: "#9f988a", letterSpacing: ".04em", whiteSpace: "nowrap" }}>
          {filteredMixes.length}<span style={{ opacity: .5 }}>/{allMixes.length}</span>
        </span>

        {/* Facets — centered */}
        <div className="flex-1 flex items-center justify-center flex-wrap" style={{ gap: 8 }}>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "#9f988a", letterSpacing: ".04em", whiteSpace: "nowrap" }}>Filter :</span>
          {FACETS.map((f) => (
            <Facet
              key={f.id}
              f={f}
              opts={opts[f.id as keyof typeof opts]}
              optCounts={optCounts[f.id]}
              sel={sel[f.id]}
              open={openFacet === f.id}
              onOpen={() => {
                setSortOpen(false);
                setOpenFacet((o) => (o === f.id ? null : f.id));
              }}
              onToggle={toggle}
              labelFor={f.id === "m" ? (v) => (movieYears[v] ? `${v} (${movieYears[v]})` : v) : undefined}
            />
          ))}
        </div>

        {/* Sort — right */}
        <div className="flex items-center gap-2 shrink-0">
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "#9f988a", letterSpacing: ".04em", whiteSpace: "nowrap" }}>Order by :</span>
          <SortMenu
            sort={sort}
            setSort={(s) => { setSort(s); setVisibleCount(INITIAL_COUNT); }}
            open={sortOpen}
            onOpen={() => { setOpenFacet(null); setSortOpen((o) => !o); }}
          />
        </div>
      </div>

      {/* Active chips */}
      {chips.length > 0 && (
        <div
          className="flex items-center justify-center flex-wrap"
          style={{ gap: 7, padding: "4px clamp(20px,4vw,56px) 0" }}
        >
          {chips.map((c) => (
            <span className="mix-chip" key={c.fid + c.v}>
              <span style={{ color: "#9f988a" }}>{c.label}:</span> {c.v}
              <button
                className="mix-chip-remove"
                onClick={() => toggle(c.fid, c.v)}
                aria-label={`Remove ${c.v}`}
              >
                ×
              </button>
            </span>
          ))}
          <button
            onClick={clearAll}
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 11,
              color: "#9f988a",
              background: "transparent",
              border: 0,
              padding: "2px 4px",
              cursor: "pointer",
              letterSpacing: ".04em",
            }}
          >
            clear all
          </button>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="text-center py-20" style={{ padding: "0 clamp(20px,4vw,56px)" }}>
          <p style={{ fontFamily: "var(--font-mono)", color: "#9f988a", fontSize: 13 }}>{error}</p>
        </div>
      )}

      {/* Skeleton */}
      {loading && (
        <div style={{ padding: "16px clamp(20px,4vw,56px) 80px" }}>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5" style={{ gap: "clamp(14px,1.6vw,24px)" }}>
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="aspect-[2/3] w-full rounded-[11px]" style={{ background: "rgba(255,255,255,.04)" }} />
            ))}
          </div>
        </div>
      )}

      {/* Empty */}
      {!loading && !error && visibleMixes.length === 0 && (
        <div className="text-center py-24" style={{ padding: "60px clamp(20px,4vw,56px)" }}>
          <p style={{ fontFamily: "var(--font-mono)", fontSize: 13, color: "#9f988a" }}>
            No mix matches these filters.
          </p>
          {anyActive && (
            <button onClick={clearAll} className="text-brand hover:underline underline-offset-4 mt-4 text-sm" style={{ fontFamily: "var(--font-sans)" }}>
              Clear filters
            </button>
          )}
        </div>
      )}

      {/* Grid */}
      {!loading && !error && visibleMixes.length > 0 && (
        <div
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5"
          style={{ gap: "clamp(14px,1.6vw,24px)", padding: "16px clamp(20px,4vw,56px) 80px" }}
        >
          {visibleMixes.map((mix, i) => (
            <MixCard
              key={mix.id}
              mix={mix}
              index={i}
              rank={rankMap.get(mix.id) ?? 0}
              filteredIds={filteredIds}
            />
          ))}
        </div>
      )}

      <div ref={sentinelRef} className="h-1" />
    </div>
  );
}

// ─── MixCard ─────────────────────────────────────────────────────────────────

function MixCard({
  mix, index, rank, filteredIds,
}: {
  mix: Mix;
  index: number;
  rank: number;
  filteredIds: string[];
}) {
  const thumbnail = mix.image ?? mix.fb_image;
  const base = BASES[index % BASES.length];
  const tintBg = `linear-gradient(155deg, color-mix(in srgb, ${base} 70%, #fff 14%), ${base} 62%, #0b0a07)`;
  const title = mix.mix_name ?? [mix.player, mix.movie].filter(Boolean).join(" × ");
  const location = useLocation();
  const cardNum = `#${String(rank).padStart(3, "0")}`;

  return (
    <Link
      to={`/mix/${mix.id}`}
      state={{ backgroundLocation: location, filteredIds }}
      className="mix-tile block relative aspect-[2/3] overflow-hidden rounded-[11px] cursor-pointer isolate"
      tabIndex={0}
      aria-label={title}
    >
      {/* Art background */}
      <div className="absolute inset-0" style={{ background: tintBg }}>
        {thumbnail ? (
          <img
            src={thumbnail}
            alt=""
            loading="lazy"
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <div
            className="absolute inset-0 flex items-center justify-center"
            style={{ fontFamily: "var(--font-display)", fontSize: 88, color: "rgba(255,255,255,.07)", lineHeight: 1 }}
          >
            {index + 1}
          </div>
        )}
      </div>

      {/* Hover overlay — mix name + authors */}
      <div className="mix-tile-ov absolute inset-0 z-[8] flex items-end" style={{ pointerEvents: "none" }}>
        <div className="w-full" style={{ background: "linear-gradient(to top, rgba(0,0,0,.88) 0%, rgba(0,0,0,.5) 55%, transparent 100%)", padding: "36px 11px 11px" }}>
          {title && (
            <p style={{ fontFamily: "var(--font-display)", fontSize: "clamp(18px,2.2vw,26px)", lineHeight: 1.0, color: "#fff", letterSpacing: ".02em", marginBottom: 5, overflowWrap: "break-word" }}>
              {title}
            </p>
          )}
          {(mix.autor_mix || mix.autor_montage) && (
            <p style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "rgba(255,255,255,.65)", letterSpacing: ".04em", lineHeight: 1.4 }}>
              {[
                mix.autor_mix ? `Mix : ${mix.autor_mix}` : null,
                mix.autor_montage ? `Montage : ${mix.autor_montage}` : null,
              ].filter(Boolean).join("  ·  ")}
            </p>
          )}
        </div>
      </div>

      {/* Card number — badge, top-left */}
      <span
        className="absolute left-[9px] top-[9px] z-[9]"
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: 11,
          letterSpacing: ".08em",
          fontWeight: 700,
          color: "#f4efe6",
          lineHeight: 1,
          background: "rgba(10,8,6,.7)",
          border: "1px solid rgba(255,255,255,.18)",
          borderRadius: 5,
          padding: "4px 7px",
          backdropFilter: "blur(6px)",
        }}
      >
        {cardNum}
      </span>
    </Link>
  );
}
