import { describe, expect, it } from "vitest";

import { newGedcomDatabase } from "../../gedcom/gedcomDatabase";
import { newGedcomExternalIdentifier } from "../../gedcom/gedcomExternalIdentifier";
import { newGedcomIndividual } from "../../gedcom/gedcomIndividual";
import { newGedcomRecord } from "../../gedcom/gedcomRecord";
import { familySearchPersonIdType } from "../../util/external-identifier-link";
import {
  applyFamilySearchIdSuggestion,
  familySearchIdsToConvert,
} from "./apply-familysearch-id-suggestion.util";

function fsftid(value: string) {
  return newGedcomRecord({ tag: "_FSFTID", value });
}

describe("familySearchIdsToConvert", () => {
  it("finds _FSFTID values without children", () => {
    const individual = newGedcomIndividual({
      xref: "@I1@",
      unknownRecords: [
        fsftid("KWCB-QS1"),
        newGedcomRecord({
          tag: "_FSFTID",
          value: "LZ12-345",
          children: [newGedcomRecord({ tag: "_FOO" })],
        }),
        newGedcomRecord({ tag: "_UID", value: "x" }),
      ],
    });
    expect(familySearchIdsToConvert(individual)).toEqual(["KWCB-QS1"]);
  });
});

describe("applyFamilySearchIdSuggestion", () => {
  it("moves _FSFTID into an EXID", () => {
    const uid = newGedcomRecord({ tag: "_UID", value: "x" });
    const database = newGedcomDatabase({
      individuals: {
        "@I1@": newGedcomIndividual({
          xref: "@I1@",
          unknownRecords: [uid, fsftid("KWCB-QS1")],
        }),
      },
    });
    const updated = applyFamilySearchIdSuggestion(database, ["@I1@"]);
    expect(updated.individuals["@I1@"]?.unknownRecords).toEqual([uid]);
    expect(updated.individuals["@I1@"]?.externalIdentifiers).toEqual([
      newGedcomExternalIdentifier({
        id: "KWCB-QS1",
        type: familySearchPersonIdType,
      }),
    ]);
  });

  it("doesn't duplicate an EXID the individual already has", () => {
    const existing = newGedcomExternalIdentifier({
      id: "KWCB-QS1",
      type: familySearchPersonIdType,
    });
    const database = newGedcomDatabase({
      individuals: {
        "@I1@": newGedcomIndividual({
          xref: "@I1@",
          externalIdentifiers: [existing],
          unknownRecords: [fsftid("KWCB-QS1")],
        }),
      },
    });
    const updated = applyFamilySearchIdSuggestion(database, ["@I1@"]);
    expect(updated.individuals["@I1@"]?.externalIdentifiers).toEqual([
      existing,
    ]);
    expect(updated.individuals["@I1@"]?.unknownRecords).toEqual([]);
  });

  it("leaves individuals without _FSFTID untouched", () => {
    const database = newGedcomDatabase({
      individuals: { "@I1@": newGedcomIndividual({ xref: "@I1@" }) },
    });
    const updated = applyFamilySearchIdSuggestion(database, ["@I1@"]);
    expect(updated.individuals["@I1@"]).toBe(database.individuals["@I1@"]);
  });
});
