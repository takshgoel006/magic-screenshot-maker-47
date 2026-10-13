import { z } from "zod";

export const predictionRequestSchema = z.object({
  channelId: z.string().trim().min(1).max(128),
  title: z.string().trim().min(1).max(150),
  uploadDate: z.string().datetime(),
});

export const predictionResponseSchema = z
  .object({
    predicted_views: z.number().int().min(0).max(10_000_000_000),
    lower_range: z.number().int().min(0).max(10_000_000_000),
    upper_range: z.number().int().min(0).max(10_000_000_000),
  })
  .refine(
    ({ lower_range, predicted_views, upper_range }) =>
      lower_range <= predicted_views && predicted_views <= upper_range,
    { message: "Prediction ranges must contain the predicted view count." },
  );

export type PredictionApiResponse = z.infer<typeof predictionResponseSchema>;