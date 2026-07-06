# Player & Movie Mix — AI Assistant Guidelines

## Project Overview

A dark cinematic catalog of collectible "mix" cards — each card pairs a football player and a movie (e.g. *Gladiambappé* = Mbappé × Gladiator). Features: filterable sortable poster grid, multi-select facet dropdowns, active filter chips, infinite scroll, lightbox detail with prev/next.

### Tech Stack

- **Framework**: Vite 7 (SPA, no SSR)
- **Routing**: React Router DOM v7
- **React**: 19, TypeScript
- **Database**: Neon PostgreSQL — accessed via Vercel API functions (server-side only)
- **UI**: shadcn/ui + Radix UI + Tailwind CSS 4
- **Fonts**: Bebas Neue (display) + Archivo (sans) + Spline Sans Mono (mono) via Google Fonts
- **Deployment**: Vercel — live at **playerandmoviemix.fr**

## Project Structure

```
api/
├── mixes/
│   ├── index.ts          # GET /api/mixes — list all mixes
│   ├── [id].ts           # GET /api/mixes/:id — single mix; PATCH — update fields
│   └── [id]/
│       └── adjacent.ts   # GET /api/mixes/:id/adjacent — prev/next mixes
src/
├── pages/
│   ├── home.tsx          # Gallery: filters, grid (object-contain), infinite scroll
│   └── mix-detail.tsx    # Detail: hero image, credits, prev/next nav
├── components/
│   ├── ui/               # shadcn/ui components
│   ├── site-header.tsx   # Dark masthead — "PLAYER × MOVIE MIX" (× in brand red)
│   ├── site-footer.tsx
│   └── theme-provider.tsx
├── lib/
│   ├── mixes.ts          # getMixes(), getMix(id), updateMix(), getAdjacentMixes()
│   ├── types.ts          # Mix type
│   └── utils.ts          # cn()
├── App.tsx               # Routes: / and /mix/:id
├── main.tsx
└── index.css             # Tailwind v4 + Google Fonts import + brand color + warm bg
scripts/
├── dev.mjs               # Kills port + runs vercel dev
└── migrate-to-neon.mjs   # One-time migration script (Supabase → Neon, already run)
```

## Architecture: API Functions

The frontend **never connects to the database directly**. All DB access goes through Vercel serverless functions in `api/`:

```
Browser → fetch("/api/mixes") → api/mixes/index.ts → Neon PostgreSQL
```

Each API function uses `@neondatabase/serverless`:
```ts
import { neon } from "@neondatabase/serverless";
const sql = neon(process.env.POSTGRES_URL!);
const rows = await sql`SELECT * FROM mixes ORDER BY created_at DESC`;
```

`POSTGRES_URL` is a server-side env variable — never prefixed with `VITE_`, never exposed to the browser.

## Database Schema (Neon PostgreSQL — shared with intelbrief project)

### Table `mixes` (215 rows)

| Column               | Type        | Notes                          |
|----------------------|-------------|--------------------------------|
| id                   | uuid        | PK                             |
| mix_name             | text        | Optional custom name           |
| player               | text        | Football player name           |
| movie                | text        | Movie title                    |
| movie_year           | integer     | Movie release year             |
| autor_mix            | text        | Mix author (primary)           |
| autor_montage        | text        | Photomontage author            |
| fb_publication_autor | text        | Publication author             |
| fb_description       | text        | Optional description           |
| fb_url               | text        | Source URL (external link)     |
| image                | text        | Primary image URL              |
| fb_image             | text        | Facebook image URL (fallback)  |
| fb_publication_date  | date        | Publication date               |
| created_at           | timestamptz | Used for prev/next ordering    |
| updated_at           | timestamptz |                                |

Index: `mixes_created_at_idx ON mixes (created_at DESC)`

### Adding new tables

Use raw SQL in Neon console or via a migration script:
```sql
CREATE TABLE comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mix_id UUID NOT NULL REFERENCES mixes(id) ON DELETE CASCADE,
  author_name TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX comments_mix_id_idx ON comments (mix_id);
```

Then add a new API function in `api/` and update `src/lib/mixes.ts` to call it.

## Environment Variables

```env
# Server-side only (Vercel API functions) — NEVER prefix with VITE_
POSTGRES_URL=postgresql://...@...neon.tech/neondb?sslmode=require

# Client-side
VITE_APP_URL=http://localhost:5173
```

Set on Vercel: Settings → Environment Variables → `POSTGRES_URL` (Production + Preview).

## Available Scripts

```bash
npm run dev        # vercel dev --listen 5173 (serves SPA + API functions)
npm run build      # tsc + vite build
npm run lint       # ESLint — ALWAYS run after changes
npm run typecheck  # TypeScript — ALWAYS run after changes
npm run preview    # Preview production build
```

> `npm run dev` requires the Vercel CLI installed globally: `npm i -g vercel`

## Deployment

- **Prod URL**: https://playerandmoviemix.fr
- **Vercel project**: `player-and-movie-mix` under `gregs-projects-faf10ce0`
- **Deploy**: `vercel --prod --yes` or push to main branch

### DNS (OVH)
| Type  | Sous-domaine | Cible                  |
|-------|-------------|------------------------|
| A     | @           | `76.76.21.21`          |
| CNAME | www         | `cname.vercel-dns.com` |

## Design System

### Aesthetic: Dark Cinematic Collectible Catalog
- **Always dark** — no light mode. Background `#100f0b`, surface `#17150f`, panel `#1b1812`
- Brand accent: `#e0573f` (orange-red) → Tailwind class `brand` (e.g. `text-brand`, `bg-brand`)
- Lines/borders: `rgba(255,255,255,.08)` → Tailwind class `border-border`
- Primary text: `#f4efe6` (`--foreground`), secondary: `#9f988a` (`--muted-foreground`)
- Display font: `font-display` = Bebas Neue 400 (logo, titles, lightbox headlines)
- Body font: `font-sans` = Archivo 500–800 (labels, card titles, UI)
- Mono font: `font-mono` = Spline Sans Mono (badges, counts, dates, hints, search)

### Design Tokens (CSS vars in `:root`)
| Token | Value | Use |
|---|---|---|
| `--background` | `#100f0b` | page bg |
| `--foreground` | `#f4efe6` | primary text |
| `--muted-foreground` | `#9f988a` | secondary / mono labels |
| `--popover` | `#1b1812` | dropdown/panel surface |
| `--border` | `rgba(255,255,255,.08)` | hairlines |
| `--accent` | `#e0573f` | brand accent (= `--color-brand`) |

### Card Design
- `aspect-[2/3]` collectible poster, `border-radius: 11px`, `overflow: hidden`
- **Art layers** (bottom → top): gradient tint background → `object-contain` image (if any) → `.mix-sheen` → `.mix-grain` → `.mix-holo`
- **Hover**: `translateY(-6px) scale(1.012)`, accent outline, `.mix-tile-ov` overlay fades in
- Never `object-cover` — images must use `object-contain`
- CSS classes for complex effects: `.mix-tile`, `.mix-tile-ov`, `.mix-grain`, `.mix-sheen`, `.mix-holo` (defined in `index.css`)

### Key UI Decisions
- **Infinite scroll** — sentinel div triggers load (60 items at a time, `INITIAL_COUNT` / `LOAD_MORE_COUNT`)
- **Filters**: multi-select facet popovers (OR within facet, AND across) + free-text search via URL `?q=` param
- **Filter state**: `sel: Record<"p"|"m"|"mix"|"mont", Set<string>>` in home.tsx local state
- **Sort**: by publication date (`ds`), movie year (`my`), or movie name (`m`) × asc/desc
- **Active chips**: removable chip row shows active filter selections
- **Edit mode**: inline editing of player/movie/mix_name, saved via PATCH `/api/mixes/:id`
- **Lightbox**: detail page opens as modal overlay (`fixed inset-0 z-[100]`) when navigating from gallery; standalone page when accessed directly
- **Prev/Next** on lightbox via `created_at` API ordering (not filter-aware)

## Guidelines for AI Assistants

### CRITICAL RULES

1. **ALWAYS run lint and typecheck** after changes:
   ```bash
   npm run lint && npm run typecheck
   ```

2. **Never use `object-cover`** on gallery cards — images must display fully (`object-contain`)

3. **No SSR** — pure Vite SPA. No `getServerSideProps`, no server components, no `"use client"`

4. **Routing** — React Router DOM v7:
   - `<Link to="/path">` for navigation
   - `useNavigate()` for programmatic navigation
   - `useParams<{ id: string }>()` in detail page

5. **No auth** — this is a public read-only site. Do not add auth gates to gallery/detail pages

6. **Font classes**:
   - `font-display` → Bebas Neue (logo, lightbox title, large headings)
   - `font-sans` → Archivo (UI labels, card hover title, body)
   - `font-mono` → Spline Sans Mono (badges, counts, dates, search field, hints)

7. **Brand color**: always use `text-brand`, `bg-brand`, `border-brand` — never hardcode `#e0573f`

8. **setState in effects** — `eslint-plugin-react-hooks` v7 forbids synchronous `setState()` at the top of `useEffect`. Use derived state or async callbacks instead

9. **DB access** — never query the DB from frontend code. Add a new file in `api/` and call it via `fetch()` from `src/lib/mixes.ts`

10. **POSTGRES_URL** — server-side only. Never expose it client-side (no `VITE_` prefix)

### Common Tasks

**Add comments to a mix:**
1. Create `comments` table in Neon (see schema example above)
2. Add `api/comments/[mixId].ts` with GET + POST handlers
3. Add `getComments(mixId)` and `addComment(...)` to `src/lib/mixes.ts`
4. Add comment section to `src/pages/mix-detail.tsx`

**Add likes:**
1. Add `likes_count INTEGER DEFAULT 0` to `mixes` table in Neon
2. Add `api/mixes/[id]/like.ts` with POST handler: `UPDATE mixes SET likes_count = likes_count + 1`
3. Update `Mix` type in `src/lib/types.ts`
4. Add like button to `mix-detail.tsx` and like count to cards

**Add a new filter:**
- Add state + unique values derivation in `home.tsx`
- Add `<FilterSelect>` to the filter bar
- Add filter condition to `filteredMixes` useMemo

**Change infinite scroll count:**
- Edit `INITIAL_COUNT` and `LOAD_MORE_COUNT` constants at top of `home.tsx`

**Add a new API route:**
```ts
// api/mixes/[id]/something.ts
import { neon } from "@neondatabase/serverless";
import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const id = Array.isArray(req.query.id) ? req.query.id[0] : req.query.id;
  const sql = neon(process.env.POSTGRES_URL!);
  const rows = await sql`SELECT ...`;
  return res.json(rows);
}
```

## Best Practices

### Neon / SQL

**Always use tagged template literals for parameterized queries:**
```ts
// CORRECT — safe, parameterized
const rows = await sql`SELECT * FROM mixes WHERE id = ${id}`;

// WRONG — SQL injection risk
const rows = await sql`SELECT * FROM mixes WHERE id = '${id}'`;
```

**Parallel queries:**
```ts
const [mix, adjacent] = await Promise.all([
  sql`SELECT * FROM mixes WHERE id = ${id} LIMIT 1`,
  sql`SELECT * FROM mixes WHERE created_at < ${createdAt} ORDER BY created_at DESC LIMIT 1`,
]);
```

### React / Vite

**Direct lucide-react imports (CRITICAL)**
```tsx
import Film from "lucide-react/dist/esm/icons/film"
```

**Lazy load heavy components**
```tsx
const HeavyChart = React.lazy(() => import("./HeavyChart"))
```

**No inline components inside render (HIGH)**

## Package Manager

Uses **npm**. Use `npm install`, `npm run build`, etc.
