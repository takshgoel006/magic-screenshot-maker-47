import { describe, expect, test } from "bun:test";
import { predictionRequestSchema, predictionResponseSchema } from "./prediction-contract";

describe("prediction request validation", () => {
  test("accepts the required channel, title, and UTC ISO upload date", () => {
    expect(
      predictionRequestSchema.safeParse({
        channelId: "UC1234567890123456789012",
        title: "A useful tutorial",
        uploadDate: "2026-10-13T05:08:00.000Z",
      }).success,
    ).toBe(true);
  });

  test("rejects missing required values and non-UTC upload dates", () => {
    expect(
      predictionRequestSchema.safeParse({
        channelId: "",
        title: "",
        uploadDate: "2026-10-13T05:08:00+02:00",
      }).success,
    ).toBe(false);
  });
});

describe("prediction response validation", () => {
  test("accepts integer view estimates with an enclosing range", () => {
    expect(
      predictionResponseSchema.safeParse({ predicted_views: 1000, lower_range: 800, upper_range: 1200 }).success,
    ).toBe(true);
  });

  test("rejects estimates outside the response range", () => {
    expect(
      predictionResponseSchema.safeParse({ predicted_views: 1300, lower_range: 800, upper_range: 1200 }).success,
    ).toBe(false);
  });
});