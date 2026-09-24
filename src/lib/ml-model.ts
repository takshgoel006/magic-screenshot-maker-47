/**
 * Mock ML model.
 *
 * This is a deterministic heuristic that stands in for the real Python model
 * until the Flask/FastAPI backend is connected. Replace only this file (or set
 * the ML_API_URL environment variable, see prediction-api.ts) to switch to the
 * real model — the request/response shapes stay identical.
 */

export type PredictionInput = {
  title: string;
  category: string;
  duration: number;
  tags: string;
  upload_day: string;
  upload_time: string;
  subscribers: number;
  average_views: number;
  likes: number;
  comments: number;
};

export type FeatureImportance = { feature: string; importance: number };

export type PredictionOutput = {
  predicted_views: number;
  lower_range: number;
  upper_range: number;
  confidence: number;
  feature_importance: FeatureImportance[];
};

const CATEGORY_WEIGHT: Record<string, number> = {
  Education: 1.0,
  Entertainment: 1.25,
  Gaming: 1.2,
  Music: 1.35,
  Technology: 1.05,
  Sports: 1.15,
  Lifestyle: 1.0,
  News: 0.95,
  Other: 0.9,
};

const DAY_WEIGHT: Record<string, number> = {
  Monday: 0.98,
  Tuesday: 1.0,
  Wednesday: 1.02,
  Thursday: 1.04,
  Friday: 1.12,
  Saturday: 1.18,
  Sunday: 1.1,
};

function durationWeight(seconds: number): number {
  if (seconds < 60) return 1.15;
  if (seconds <= 600) return 1.1;
  if (seconds <= 1200) return 1.0;
  if (seconds <= 2400) return 0.9;
  return 0.8;
}

function timeWeight(uploadTime: string): number {
  const hour = Number((uploadTime || "12:00").split(":")[0]) || 12;
  if (hour >= 16 && hour <= 21) return 1.15;
  if (hour >= 11 && hour < 16) return 1.05;
  if (hour >= 6 && hour < 11) return 0.98;
  return 0.9;
}

export function mockPredict(input: PredictionInput): PredictionOutput {
  const base = Math.max(input.average_views, input.subscribers * 0.08, 500);

  const tagCount = input.tags.split(",").filter((t) => t.trim().length > 0).length;
  const tagWeight = 0.92 + Math.min(tagCount, 12) * 0.015;

  const titleWords = input.title.trim().split(/\s+/).length;
  const titleWeight = titleWords >= 5 && titleWords <= 14 ? 1.08 : 0.97;

  const engagement =
    input.average_views > 0
      ? Math.min((input.likes + input.comments * 3) / Math.max(input.average_views, 1), 0.25)
      : 0;
  const engagementWeight = 1 + engagement * 1.6;

  const multiplier =
    (CATEGORY_WEIGHT[input.category] ?? 1) *
    (DAY_WEIGHT[input.upload_day] ?? 1) *
    durationWeight(input.duration) *
    timeWeight(input.upload_time) *
    tagWeight *
    titleWeight *
    engagementWeight;

  const predicted = Math.round(base * multiplier);
  const spread = 0.16;

  const confidence = Math.round(Math.min(96, 72 + Math.min(tagCount, 8) * 1.4 + engagement * 40) * 10) / 10;

  const raw: FeatureImportance[] = [
    { feature: "Channel Average Views", importance: 0.32 },
    { feature: "Subscribers", importance: 0.21 },
    { feature: "Category", importance: 0.14 },
    { feature: "Engagement (Likes / Comments)", importance: 0.12 },
    { feature: "Upload Day & Time", importance: 0.11 },
    { feature: "Duration", importance: 0.06 },
    { feature: "Tags & Title", importance: 0.04 },
  ];

  return {
    predicted_views: predicted,
    lower_range: Math.round(predicted * (1 - spread)),
    upper_range: Math.round(predicted * (1 + spread)),
    confidence,
    feature_importance: raw,
  };
}
