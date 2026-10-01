import { UrlSegment } from "@angular/router";
import { describe, expect, it } from "vitest";

import { placePathMatcher } from "./place.matcher";

describe("placePathMatcher", () => {
  it("joins every remaining segment into a single path param", () => {
    const segments = [
      new UrlSegment("united-states", {}),
      new UrlSegment("maryland", {}),
      new UrlSegment("cecil-county", {}),
    ];

    const result = placePathMatcher(segments, {} as never, {});

    expect(result?.consumed).toBe(segments);
    expect(result?.posParams?.["path"]?.path).toBe(
      "united-states/maryland/cecil-county",
    );
  });

  it("does not match when there are no segments", () => {
    expect(placePathMatcher([], {} as never, {})).toBeNull();
  });
});
