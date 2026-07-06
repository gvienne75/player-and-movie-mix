import type { Mix } from "@/lib/types";

const API_BASE = "/api/mixes";

export async function getMixes(): Promise<Mix[]> {
  const res = await fetch(API_BASE);
  if (!res.ok) throw new Error("Failed to fetch mixes");
  return res.json() as Promise<Mix[]>;
}

export async function getMix(id: string): Promise<Mix | null> {
  const res = await fetch(`${API_BASE}/${id}`);
  if (!res.ok) return null;
  return res.json() as Promise<Mix>;
}

export async function updateMix(
  id: string,
  fields: Partial<Pick<Mix, "player" | "movie" | "mix_name">>
): Promise<void> {
  const res = await fetch(`${API_BASE}/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(fields),
  });
  if (!res.ok) throw new Error("Failed to update mix");
}

export async function getAdjacentMixes(
  currentMix: Mix
): Promise<{ prev: Mix | null; next: Mix | null }> {
  const res = await fetch(`${API_BASE}/${currentMix.id}/adjacent`);
  if (!res.ok) return { prev: null, next: null };
  return res.json() as Promise<{ prev: Mix | null; next: Mix | null }>;
}
