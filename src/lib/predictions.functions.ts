import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import { predictViews } from "./prediction-api";
import type { FeatureImportance } from "./ml-model";

export type PredictionRow = {
  id: string;
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
  predicted_views: number;
  lower_range: number;
  upper_range: number;
  confidence: number;
  actual_views: number | null;
  feature_importance: FeatureImportance[];
  created_at: string;
};

const predictionInputSchema = z.object({
  title: z.string().trim().min(3, "Title must be at least 3 characters").max(150),
  category: z.string().trim().min(1),
  duration: z.number().int().min(1).max(86400),
  tags: z.string().trim().max(500),
  upload_day: z.string().trim().min(1),
  upload_time: z.string().trim().min(1).max(10),
  subscribers: z.number().int().min(0).max(1_000_000_000),
  average_views: z.number().int().min(0).max(10_000_000_000),
  likes: z.number().int().min(0).max(10_000_000_000),
  comments: z.number().int().min(0).max(10_000_000_000),
});

export const createPrediction = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => predictionInputSchema.parse(input))
  .handler(async ({ data, context }) => {
    const result = await predictViews(data);

    const { data: row, error } = await context.supabase
      .from("predictions")
      .insert({
        user_id: context.userId,
        ...data,
        predicted_views: result.predicted_views,
        lower_range: result.lower_range,
        upper_range: result.upper_range,
        confidence: result.confidence,
        feature_importance: result.feature_importance,
      })
      .select("id")
      .single();

    if (error) throw new Error(error.message);
    return { id: row.id as string };
  });

export const listPredictions = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("predictions")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []) as unknown as PredictionRow[];
  });

export const getPrediction = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("predictions")
      .select("*")
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return (row ?? null) as unknown as PredictionRow | null;
  });

export const deletePrediction = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("predictions").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const updateActualViews = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({
      id: z.string().uuid(),
      actual_views: z.number().int().min(0).max(10_000_000_000),
    }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("predictions")
      .update({ actual_views: data.actual_views })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export type ProfileRow = {
  id: string;
  full_name: string;
  default_category: string;
  notifications_enabled: boolean;
  theme_preference: string;
  created_at: string;
};

export const getProfile = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("profiles")
      .select("*")
      .eq("id", context.userId)
      .maybeSingle();
    if (error) throw new Error(error.message);

    const email = (context.claims as { email?: string } | null)?.email ?? "";
    return {
      profile: (data ?? null) as unknown as ProfileRow | null,
      email,
    };
  });

export const updateProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        full_name: z.string().trim().max(100),
        default_category: z.string().trim().min(1),
        notifications_enabled: z.boolean(),
        theme_preference: z.string().trim().min(1),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("profiles")
      .upsert({ id: context.userId, ...data });
    if (error) throw new Error(error.message);
    return { ok: true };
  });
