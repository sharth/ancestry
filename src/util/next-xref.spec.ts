import { describe, expect, it } from "vitest";

import { newGedcomDatabase } from "../gedcom/gedcomDatabase";
import { newGedcomFact } from "../gedcom/gedcomFact";
import { newGedcomFamily } from "../gedcom/gedcomFamily";
import { newGedcomIndividual } from "../gedcom/gedcomIndividual";
import { newGedcomMultimedia } from "../gedcom/gedcomMultimedia";
import { newGedcomMultimediaLink } from "../gedcom/gedcomMultimediaLink";
import { newGedcomName } from "../gedcom/gedcomName";
import { newGedcomRepositoryLink } from "../gedcom/gedcomRepositoryLink";
import { newGedcomSource } from "../gedcom/gedcomSource";
import { newGedcomSourceCitation } from "../gedcom/gedcomSourceCitation";
import {
  calculateNextFamilyXref,
  calculateNextIndividualXref,
  calculateNextMultimediaXref,
  calculateNextRepositoryXref,
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

  it("only counts xrefs with the matching prefix", () => {
    const gedcomDatabase = newGedcomDatabase({
      individuals: { "@I1@": newGedcomIndividual({ xref: "@I1@" }) },
      sources: { "@S10@": newGedcomSource({ xref: "@S10@" }) },
    });
    expect(calculateNextIndividualXref(gedcomDatabase)).toBe("@I2@");
  });

  describe("xrefs that are only linked to", () => {
    it("individual: skips xrefs used by a family's HUSB/WIFE/CHIL", () => {
      const gedcomDatabase = newGedcomDatabase({
        families: {
          "@F0@": newGedcomFamily({
            xref: "@F0@",
            husbandXref: "@I2@",
            wifeXref: "@I7@",
            childXrefs: ["@I4@"],
          }),
        },
      });
      expect(calculateNextIndividualXref(gedcomDatabase)).toBe("@I8@");
    });

    it("individual: skips xrefs used by a fact's shared-with list", () => {
      const gedcomDatabase = newGedcomDatabase({
        individuals: {
          "@I0@": newGedcomIndividual({
            xref: "@I0@",
            facts: [
              newGedcomFact({
                tag: "BIRT",
                sharedWith: [{ xref: "@I9@", role: "Witness" }],
              }),
            ],
          }),
        },
      });
      expect(calculateNextIndividualXref(gedcomDatabase)).toBe("@I10@");
    });

    it("family: skips xrefs used by an individual's FAMS/FAMC", () => {
      const gedcomDatabase = newGedcomDatabase({
        individuals: {
          "@I0@": newGedcomIndividual({
            xref: "@I0@",
            parentOfFamilyXrefs: ["@F3@"],
            childOfFamilyXrefs: ["@F5@"],
          }),
        },
      });
      expect(calculateNextFamilyXref(gedcomDatabase)).toBe("@F6@");
    });

    it("source: skips xrefs used by a citation", () => {
      const gedcomDatabase = newGedcomDatabase({
        individuals: {
          "@I0@": newGedcomIndividual({
            xref: "@I0@",
            names: [
              newGedcomName({
                citations: [newGedcomSourceCitation({ sourceXref: "@S4@" })],
              }),
            ],
          }),
        },
      });
      expect(calculateNextSourceXref(gedcomDatabase)).toBe("@S5@");
    });

    it("repository: skips xrefs used by a source's repository link", () => {
      const gedcomDatabase = newGedcomDatabase({
        sources: {
          "@S0@": newGedcomSource({
            xref: "@S0@",
            repositoryLinks: [
              newGedcomRepositoryLink({ repositoryXref: "@R2@" }),
            ],
          }),
        },
      });
      expect(calculateNextRepositoryXref(gedcomDatabase)).toBe("@R3@");
    });

    it("multimedia: skips xrefs used by source and citation links", () => {
      const gedcomDatabase = newGedcomDatabase({
        sources: {
          "@S0@": newGedcomSource({
            xref: "@S0@",
            multimediaLinks: [newGedcomMultimediaLink({ xref: "@M2@" })],
          }),
        },
        families: {
          "@F0@": newGedcomFamily({
            xref: "@F0@",
            citations: [
              newGedcomSourceCitation({
                sourceXref: "@S0@",
                multimediaLinks: [newGedcomMultimediaLink({ xref: "@M6@" })],
              }),
            ],
          }),
        },
      });
      expect(calculateNextMultimediaXref(gedcomDatabase)).toBe("@M7@");
    });
  });
});
