/**
 * Centralized prediction service.
 *
 * Runs on the server. If the ML_API_URL environment variable is set, the
 * request is forwarded to the Python ML backend (POST /api/predict with the
 * exact payload documented below). Otherwise the local mock model is used, so
 * the app works end-to-end without a backend.
 *
 * Request:  { title, category, duration, tags, upload_day, upload_time,
 *             subscribers, average_views, likes, comments }
 * Response: { predicted_views, lower_range, upper_range,
 *             confidence?, feature_importance? }
 */
import { mockPredict, type PredictionInput, type PredictionOutput } from "./ml-model";

export async function predictViews(input: PredictionInput): Promise<PredictionOutput> {
  const endpoint = process.env["ML_API_URL"];
  if (!endpoint) return mockPredict(input);

  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    throw new Error(`Prediction service returned ${response.status}`);
  }

  const data = (await response.json()) as Partial<PredictionOutput>;
  const fallback = mockPredict(input);

  return {
    predicted_views: Number(data.predicted_views ?? fallback.predicted_views),
    lower_range: Number(data.lower_range ?? fallback.lower_range),
    upper_range: Number(data.upper_range ?? fallback.upper_range),
    confidence: Number(data.confidence ?? fallback.confidence),
    feature_importance: data.feature_importance ?? fallback.feature_importance,
  };
}
