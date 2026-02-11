import {
  calculateNextIndividualXref,
  calculateNextSourceXref,
} from "./ancestry.service";
import { describe, expect, it } from "vitest";

describe("AncestryService helpers", () => {
  describe("calculateNextIndividualXref", () => {
    it("should return @I0@ for an empty database", () => {
      expect(calculateNextIndividualXref({})).toBe("@I0@");
    });

    it("should return the next available index", () => {
      const individuals = {
        "@I1@": { xref: "@I1@" },
        "@I5@": { xref: "@I5@" },
      };
      // @ts-expect-error - Partial mock
      expect(calculateNextIndividualXref(individuals)).toBe("@I6@");
    });

    it("should handle non-conforming xrefs by ignoring them", () => {
      const individuals = {
        "@I1@": { xref: "@I1@" },
        OTHER: { xref: "OTHER" },
      };
      // @ts-expect-error - Partial mock
      expect(calculateNextIndividualXref(individuals)).toBe("@I2@");
    });
  });

  describe("calculateNextSourceXref", () => {
    it("should return @S0@ for an empty database", () => {
      expect(calculateNextSourceXref({})).toBe("@S0@");
    });

    it("should return the next available index", () => {
      const sources = {
        "@S1@": { xref: "@S1@" },
        "@S10@": { xref: "@S10@" },
      };
      // @ts-expect-error - Partial mock
      expect(calculateNextSourceXref(sources)).toBe("@S11@");
    });
  });
});
