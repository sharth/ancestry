import { describe, expect, it } from "vitest";

import { bestMatchRank, matchRank } from "./search.util";

describe("matchRank", () => {
  it("ranks an exact match as 0", () => {
    expect(matchRank("Boston", "boston")).toBe(0);
  });

  it("ranks a prefix match as 1", () => {
    expect(matchRank("Boston, MA", "boston")).toBe(1);
  });

  it("ranks a substring match as 2", () => {
    expect(matchRank("New Boston, NH", "boston")).toBe(2);
  });

  it("returns undefined when there is no match", () => {
    expect(matchRank("Chicago", "boston")).toBeUndefined();
  });

  it("returns undefined for an empty haystack", () => {
    expect(matchRank("", "boston")).toBeUndefined();
  });
});

describe("bestMatchRank", () => {
  it("picks the lowest rank across candidates", () => {
    expect(bestMatchRank(["New Boston", "Boston"], "boston")).toBe(0);
  });

  it("returns undefined when nothing matches", () => {
    expect(bestMatchRank(["Chicago", "Denver"], "boston")).toBeUndefined();
  });
});
