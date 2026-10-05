import type { PredictionRow } from "./predictions.functions";

export const predictionsKey = ["predictions"] as const;
export const profileKey = ["profile"] as const;

export function accuracyOf(p: PredictionRow): number | null {
  if (p.actual_views == null || p.actual_views <= 0) return null;
  const err = Math.abs(p.predicted_views - p.actual_views) / p.actual_views;
  return Math.max(0, Math.round((1 - err) * 1000) / 10);
}

export function filterByRange<T extends { created_at: string }>(rows: T[], range: string): T[] {
  const days = range === "7d" ? 7 : range === "30d" ? 30 : range === "3m" ? 90 : 0;
  if (!days) return rows;
  const cutoff = Date.now() - days * 86400000;
  return rows.filter((r) => new Date(r.created_at).getTime() >= cutoff);
}

export function trendData(rows: PredictionRow[]) {
  const map = new Map<string, { date: string; predicted: number; actual: number }>();
  [...rows].reverse().forEach((r) => {
    const date = new Date(r.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric" });
    const cur = map.get(date) ?? { date, predicted: 0, actual: 0 };
    cur.predicted += r.predicted_views;
    cur.actual += r.actual_views ?? 0;
    map.set(date, cur);
  });
  return [...map.values()];
}
