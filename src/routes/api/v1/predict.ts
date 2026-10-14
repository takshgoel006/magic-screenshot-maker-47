import { createClient } from "@supabase/supabase-js";
import { createFileRoute } from "@tanstack/react-router";
import type { Database } from "@/integrations/supabase/types";
import { mockPredict } from "@/lib/ml-model";
import { predictionRequestSchema, predictionResponseSchema } from "@/lib/prediction-contract";

export const Route = createFileRoute("/api/v1/predict")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const contentType = request.headers.get("content-type") ?? "";
        if (!contentType.toLowerCase().includes("application/json")) {
          return Response.json({ error: "Content-Type must be application/json." }, { status: 415 });
        }

        let body: unknown;
        try {
          body = await request.json();
        } catch {
          return Response.json({ error: "Request body must be valid JSON." }, { status: 400 });
        }

        const parsed = predictionRequestSchema.safeParse(body);
        if (!parsed.success) {
          return Response.json({ error: "Provide a channel ID, title, and UTC upload date." }, { status: 400 });
        }

        const authorization = request.headers.get("authorization");
        const token = authorization?.startsWith("Bearer ") ? authorization.slice(7) : "";
        if (!token || token.split(".").length !== 3) {
          return Response.json({ error: "Sign in before requesting a prediction." }, { status: 401 });
        }

        const url = process.env["SUPABASE_URL"];
        const publishableKey = process.env["SUPABASE_PUBLISHABLE_KEY"];
        if (!url || !publishableKey) {
          return Response.json({ error: "Prediction service is unavailable." }, { status: 503 });
        }

        const supabase = createClient<Database>(url, publishableKey, {
          auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
          global: {
            headers: { Authorization: `Bearer ${token}` },
            fetch: (input, init) => {
              const headers = new Headers(
                typeof Request !== "undefined" && input instanceof Request ? input.headers : undefined,
              );
              if (init?.headers) new Headers(init.headers).forEach((value, key) => headers.set(key, value));
              if (publishableKey.startsWith("sb_") && headers.get("Authorization") === `Bearer ${publishableKey}`) {
                headers.delete("Authorization");
              }
              headers.set("apikey", publishableKey);
              return fetch(input, { ...init, headers });
            },
          },
        });
        const { data: claims, error: authError } = await supabase.auth.getClaims(token);
        if (authError || !claims?.claims?.sub) {
          return Response.json({ error: "Sign in before requesting a prediction." }, { status: 401 });
        }

        const uploadDate = new Date(parsed.data.uploadDate);
        const prediction = mockPredict({
          title: parsed.data.title,
          category: "Other",
          duration: 600,
          tags: "",
          upload_day: uploadDate.toLocaleDateString("en-US", { weekday: "long", timeZone: "UTC" }),
          upload_time: uploadDate.toLocaleTimeString("en-GB", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
            timeZone: "UTC",
          }),
          subscribers: 0,
          average_views: 0,
          likes: 0,
          comments: 0,
        });
        const response = predictionResponseSchema.parse({
          predicted_views: prediction.predicted_views,
          lower_range: prediction.lower_range,
          upper_range: prediction.upper_range,
        });
        return Response.json(response, { headers: { "Cache-Control": "private, no-store" } });
      },
    },
  },
});