import { produce } from "immer";
import { describe, expect, it } from "vitest";

import { newGedcomDatabase } from "../gedcom/gedcomDatabase";
import { newGedcomFamily } from "../gedcom/gedcomFamily";
import { newGedcomIndividual } from "../gedcom/gedcomIndividual";
import { syncFamilyLinks } from "./family-links";

describe("syncFamilyLinks", () => {
  const original = newGedcomDatabase({
    individuals: {
      "@I1@": newGedcomIndividual({
        xref: "@I1@",
        parentOfFamilyXrefs: ["@F1@"],
      }),
      "@I2@": newGedcomIndividual({
        xref: "@I2@",
        childOfFamilyXrefs: ["@F1@"],
      }),
      "@I3@": newGedcomIndividual({ xref: "@I3@" }),
    },
    families: {
      "@F1@": newGedcomFamily({
        xref: "@F1@",
        husbandXref: "@I1@",
        childXrefs: ["@I2@"],
      }),
    },
  });

  it("returns the database unchanged when no family changed", () => {
    expect(syncFamilyLinks(original, original)).toBe(original);
  });

  it("only replaces the individuals whose links change", () => {
    const edited = produce(original, (draft) => {
      const family = draft.families["@F1@"];
      if (family) family.childXrefs.push("@I3@");
    });

    const synced = syncFamilyLinks(original, edited);

    expect(synced.individuals["@I3@"]?.childOfFamilyXrefs).toEqual(["@F1@"]);
    expect(synced.individuals["@I1@"]).toBe(original.individuals["@I1@"]);
    expect(synced.individuals["@I2@"]).toBe(original.individuals["@I2@"]);
  });

  it("drops links to a family that was removed", () => {
    const edited = produce(original, (draft) => {
      delete draft.families["@F1@"];
    });

    const synced = syncFamilyLinks(original, edited);

    expect(synced.individuals["@I1@"]?.parentOfFamilyXrefs).toEqual([]);
    expect(synced.individuals["@I2@"]?.childOfFamilyXrefs).toEqual([]);
  });

  it("ignores empty and unknown xrefs", () => {
    const edited = produce(original, (draft) => {
      const family = draft.families["@F1@"];
      if (family) {
        family.wifeXref = "@I9@";
        family.childXrefs.push("");
      }
    });

    expect(syncFamilyLinks(original, edited).individuals).toBe(
      edited.individuals,
    );
  });
});
