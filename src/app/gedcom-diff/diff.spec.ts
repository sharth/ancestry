import { describe, expect, it } from "vitest";
import { diff } from "./diff";

describe("diff", () => {
  it("should return identical differences for identical arrays", () => {
    const lhs = ["a", "b", "c"];
    const rhs = ["a", "b", "c"];
    const diffs = diff(lhs, rhs);
    expect(diffs).toEqual([
      { lhs: "a", rhs: "a", identical: true },
      { lhs: "b", rhs: "b", identical: true },
      { lhs: "c", rhs: "c", identical: true },
    ]);
  });

  it("should handle prefix and suffix correctly", () => {
    const lhs = ["pre", "x", "y", "post"];
    const rhs = ["pre", "a", "b", "post"];
    const diffs = diff(lhs, rhs);
    expect(diffs).toEqual([
      { lhs: "pre", rhs: "pre", identical: true },
      { lhs: "x", rhs: "a", identical: false },
      { lhs: "y", rhs: "b", identical: false },
      { lhs: "post", rhs: "post", identical: true },
    ]);
  });

  it("should detect additions and deletions", () => {
    const lhs = ["a", "b"];
    const rhs = ["a", "b", "c", "d"];
    const diffs = diff(lhs, rhs);
    expect(diffs).toEqual([
      { lhs: "a", rhs: "a", identical: true },
      { lhs: "b", rhs: "b", identical: true },
      { lhs: undefined, rhs: "c", identical: false },
      { lhs: undefined, rhs: "d", identical: false },
    ]);
  });

  it("should handle completely different arrays", () => {
    const lhs = ["x", "y"];
    const rhs = ["a", "b"];
    const diffs = diff(lhs, rhs);
    expect(diffs).toEqual([
      { lhs: "x", rhs: "a", identical: false },
      { lhs: "y", rhs: "b", identical: false },
    ]);
  });

  it("should work with empty left side", () => {
    const lhs: string[] = [];
    const rhs = ["only"];
    const diffs = diff(lhs, rhs);
    expect(diffs).toEqual([{ lhs: undefined, rhs: "only", identical: false }]);
  });

  it("should work with empty right side", () => {
    const lhs = ["only"];
    const rhs: string[] = [];
    const diffs = diff(lhs, rhs);
    expect(diffs).toEqual([{ lhs: "only", rhs: undefined, identical: false }]);
  });
});
