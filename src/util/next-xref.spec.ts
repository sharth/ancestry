import { describe, expect, it } from "vitest";
import { newGedcomDatabase } from "../gedcom/gedcomDatabase";
import { newGedcomIndividual } from "../gedcom/gedcomIndividual";
import { newGedcomMultimedia } from "../gedcom/gedcomMultimedia";
import { newGedcomSource } from "../gedcom/gedcomSource";
import {
  calculateNextIndividualXref,
  calculateNextMultimediaXref,
  calculateNextSourceXref,
} from "./next-xref";

describe("GedcomEditorComponent helpers", () => {
  describe("calculateNextIndividualXref", () => {
    it("should return @I0@ for an empty database", () => {
      const gedcomDatabase = newGedcomDatabase();
      expect(calculateNextIndividualXref(gedcomDatabase)).toBe("@I0@");
    });

    it("should return the next available index", () => {
      const gedcomDatabase = newGedcomDatabase({
        individuals: {
          "@I1@": newGedcomIndividual({ xref: "@I1@" }),
          "@I5@": newGedcomIndividual({ xref: "@I5@" }),
        },
      });
      expect(calculateNextIndividualXref(gedcomDatabase)).toBe("@I6@");
    });

    it("should handle non-conforming xrefs by ignoring them", () => {
      const gedcomDatabase = newGedcomDatabase({
        individuals: {
          "@I1@": newGedcomIndividual({ xref: "@I1@" }),
          OTHER: newGedcomIndividual({ xref: "OTHER" }),
        },
      });
      expect(calculateNextIndividualXref(gedcomDatabase)).toBe("@I2@");
    });
  });

  describe("calculateNextSourceXref", () => {
    it("should return @S0@ for an empty database", () => {
      const gedcomDatabase = newGedcomDatabase();
      expect(calculateNextSourceXref(gedcomDatabase)).toBe("@S0@");
    });

    it("should return the next available index", () => {
      const gedcomDatabase = newGedcomDatabase({
        sources: {
          "@S1@": newGedcomSource({ xref: "@S1@" }),
          "@S10@": newGedcomSource({ xref: "@S10@" }),
        },
      });
      expect(calculateNextSourceXref(gedcomDatabase)).toBe("@S11@");
    });
  });

  describe("calculateNextMultimediaXref", () => {
    it("should return @M0@ for an empty database", () => {
      const gedcomDatabase = newGedcomDatabase();
      expect(calculateNextMultimediaXref(gedcomDatabase)).toBe("@M0@");
    });

    it("should return the next available index", () => {
      const gedcomDatabase = newGedcomDatabase({
        multimedias: {
          "@M1@": newGedcomMultimedia({ xref: "@M1@" }),
          "@M3@": newGedcomMultimedia({ xref: "@M3@" }),
        },
      });
      expect(calculateNextMultimediaXref(gedcomDatabase)).toBe("@M4@");
    });

    it("should handle non-conforming xrefs by ignoring them", () => {
      const gedcomDatabase = newGedcomDatabase({
        multimedias: {
          "@M1@": newGedcomMultimedia({ xref: "@M1@" }),
          OTHER: newGedcomMultimedia({ xref: "OTHER" }),
        },
      });
      expect(calculateNextMultimediaXref(gedcomDatabase)).toBe("@M2@");
    });
  });
});
