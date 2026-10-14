import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { predictionRequestSchema, predictionResponseSchema } from "./prediction-contract";

describe("prediction request validation", () => {
  test("accepts the required channel, title, and UTC ISO upload date", () => {
    assert.equal(
      predictionRequestSchema.safeParse({
        channelId: "UC1234567890123456789012",
        title: "A useful tutorial",
        uploadDate: "2026-10-13T05:08:00.000Z",
      }).success,
      true,
    );
  });

  test("rejects missing required values and non-UTC upload dates", () => {
    assert.equal(
      predictionRequestSchema.safeParse({
        channelId: "",
        title: "",
        uploadDate: "2026-10-13T05:08:00+02:00",
      }).success,
      false,
    );
  });
});

describe("prediction response validation", () => {
  test("accepts integer view estimates with an enclosing range", () => {
    assert.equal(
      predictionResponseSchema.safeParse({ predicted_views: 1000, lower_range: 800, upper_range: 1200 }).success,
      true,
    );
  });

  test("rejects estimates outside the response range", () => {
    assert.equal(
      predictionResponseSchema.safeParse({ predicted_views: 1300, lower_range: 800, upper_range: 1200 }).success,
      false,
    );
  });
});