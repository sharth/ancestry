import {
  calculateNextIndividualXref,
  calculateNextMultimediaXref,
  calculateNextSourceXref,
} from "./gedcom-editor.component";
import { describe, expect, it } from "vitest";

describe("GedcomEditorComponent helpers", () => {
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

  describe("calculateNextMultimediaXref", () => {
    it("should return @M0@ for an empty database", () => {
      expect(calculateNextMultimediaXref({})).toBe("@M0@");
    });

    it("should return the next available index", () => {
      const multimedias = {
        "@M1@": { xref: "@M1@" },
        "@M3@": { xref: "@M3@" },
      };
      // @ts-expect-error - Partial mock
      expect(calculateNextMultimediaXref(multimedias)).toBe("@M4@");
    });

    it("should handle non-conforming xrefs by ignoring them", () => {
      const multimedias = {
        "@M1@": { xref: "@M1@" },
        OTHER: { xref: "OTHER" },
      };
      // @ts-expect-error - Partial mock
      expect(calculateNextMultimediaXref(multimedias)).toBe("@M2@");
    });
  });
});
